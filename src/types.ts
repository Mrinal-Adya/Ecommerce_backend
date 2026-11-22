export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  rating: {
    score: number;
    count: number;
  };
}

export interface CategoryProductsResponse {
  category: string;
  topRated: Product[];
  products: Product[];
}

export interface EnquiryRequest {
  name: string;
  email: string;
  phone: string;
  productId?: number | null;
  productTitle?: string | null;
  quantity?: number;
}