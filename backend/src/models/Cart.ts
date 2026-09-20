export interface ICartItem {
  productId: number;
  quantity: number;
  price?: number;
  name?: string;
}

export interface ICart {
  id: number;
  user_id: number;
  items: ICartItem[];
  total_amount: number;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export default ICart;
