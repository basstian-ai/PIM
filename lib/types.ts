export type Money = {
  amountCents: number;
  currency: string;
};

export type Image = {
  url: string;
  alt?: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  path?: string | null;
};

export type Variant = {
  id: string;
  sku?: string | null;
  title?: string | null;
  attributes: Record<string, unknown>;
  price: Money;
  stockOnHand: number;
  isDefault: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  status: 'draft' | 'published' | 'archived';
  specs: Record<string, unknown>;
  categories: Category[];
  images: Image[];
  variants: Variant[];
};

export type PaginatedProducts = {
  page: number;
  pageSize: number;
  total: number;
  items: Product[];
};

export type ProductInput = {
  sku: string;
  name: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  specs?: Record<string, unknown>;
  categoryIds?: string[];
  images?: Image[];
  variants: Array<
    Omit<Variant, 'id' | 'price'> & {
      id?: string;
      price: Money;
    }
  >;
};

export type ProfileRole = 'admin' | 'editor' | 'viewer';

export type Profile = {
  userId: string;
  role: ProfileRole;
};
