import { Product } from './types.js';

export interface CatalogProvider {
  getAllProducts(): Promise<Product[]>;
  getCategories(): Promise<string[]>;
  getProductById(id: number): Promise<Product | null>;
}

interface FakeStoreRawProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate?: number;
    count?: number;
  };
}

export class FakeStoreCatalogProvider implements CatalogProvider {
  private readonly baseUrl: string;
  private cachedProducts: Product[] | null = null;
  private cacheTimestamp = 0;
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl = process.env.FAKESTORE_BASE_URL || 'https://fakestoreapi.com') {
    this.baseUrl = baseUrl;
  }

  async getAllProducts(): Promise<Product[]> {
    const now = Date.now();
    if (this.cachedProducts && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.cachedProducts;
    }

    const response = await fetch(`${this.baseUrl}/products`);
    if (!response.ok) {
      throw new Error(`Upstream FakeStore API error: ${response.status}`);
    }

    const rawProducts = (await response.json()) as FakeStoreRawProduct[];
    this.cachedProducts = rawProducts.map(this.toDomainProduct);
    this.cacheTimestamp = now;
    return this.cachedProducts;
  }

  async getCategories(): Promise<string[]> {
    const products = await this.getAllProducts();
    return Array.from(new Set(products.map((p) => p.category)));
  }

  async getProductById(id: number): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find((p) => p.id === id) ?? null;
  }

  private toDomainProduct(raw: FakeStoreRawProduct): Product {
    return {
      id: raw.id,
      title: raw.title,
      price: raw.price,
      description: raw.description,
      category: raw.category,
      imageUrl: raw.image,
      rating: {
        score: raw.rating?.rate ?? 0,
        count: raw.rating?.count ?? 0,
      },
    };
  }
}