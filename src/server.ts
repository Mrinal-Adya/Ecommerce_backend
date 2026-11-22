import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { FakeStoreCatalogProvider, CatalogProvider } from './catalogProvider.js';
import { ConsoleEmailService, EmailService } from './emailService.js';
import { CategoryProductsResponse, EnquiryRequest, Product } from './types.js';

export function createApp(
  catalogProvider: CatalogProvider = new FakeStoreCatalogProvider(),
  emailService: EmailService = new ConsoleEmailService()
) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sortByTopRated = (items: Product[]): Product[] =>
    [...items].sort((a, b) => b.rating.score - a.rating.score || b.rating.count - a.rating.count);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 1. Home page: Top 5 featured products
  app.get('/api/products/featured', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await catalogProvider.getAllProducts();
      const top5 = sortByTopRated(products).slice(0, 5);
      res.json(top5);
    } catch (err) {
      next(err);
    }
  });

  // 2. List all categories
  app.get('/api/categories', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await catalogProvider.getCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  });

  // 3. Category page: Top rated + additional products in category
  app.get('/api/categories/:category', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = decodeURIComponent(req.params.category);
      const products = await catalogProvider.getAllProducts();
      const categoryProducts = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );

      if (categoryProducts.length === 0) {
        res.status(404).json({ error: `Category '${category}' not found` });
        return;
      }

      const sorted = sortByTopRated(categoryProducts);
      const topRated = sorted.slice(0, 2);
      const remaining = sorted.slice(2);

      const payload: CategoryProductsResponse = {
        category,
        topRated,
        products: remaining,
      };
      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  // 4. Search products (?q=...)
  app.get('/api/products', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const products = await catalogProvider.getAllProducts();

      if (!query) {
        res.json(products);
        return;
      }

      const matched = products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
      res.json(matched);
    } catch (err) {
      next(err);
    }
  });

  // 5. Product details page
  app.get('/api/products/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }

      const product = await catalogProvider.getProductById(id);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  // 6. Product enquiry submission
 // 6. Product enquiry submission
  app.post('/api/enquiries', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        email,
        phone,
        productId,
        productTitle,
        quantity,
      } = req.body as Partial<EnquiryRequest>;

      if (!name?.trim() || !email?.trim() || !phone?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Name, email, and phone are required',
        });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email address',
        });
        return;
      }

      let product: Product | null = null;
      if (productId !== undefined && productId !== null) {
        product = await catalogProvider.getProductById(Number(productId));
      }

      await emailService.sendEnquiry(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          productId: productId ?? null,
          productTitle: productTitle?.trim() || product?.title || null,
          quantity: quantity && quantity > 0 ? quantity : 1,
        },
        product
      );

      res.status(201).json({
        success: true,
        message: 'Thank you! Your enquiry has been sent to our sales team.',
      });
    } catch (err) {
      next(err);
    }
  });

  // Centralized error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(502).json({ error: 'Failed to process request against upstream catalog' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}