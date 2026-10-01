import express from 'express';
import path from 'path'
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./configs/env.js"
import connectDb from './configs/db.js';
import { initializeStoreConfig } from './operations/storeConfig/storeConfig.operation.js';
import { seedAdminUser } from './utils/seedAdmin.js';
import multer from "multer";
import authRoutes from "./routes/auth.routes.js"
import productRoutes from "./routes/product.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import cartRoutes from "./routes/cart.routes.js"
import storeConfigRoutes from "./routes/storeConfig.routes.js"
import deliveryOptionRoutes from "./routes/deliveryOption.routes.js"
import discountRoutes from "./routes/discount.routes.js"
import chargeRoutes from "./routes/charge.routes.js"
import orderRoutes from "./routes/order.routes.js"
import razorpayRoutes from "./modules/payments/razorpay/razorpay.routes.js"
import paypalRoutes from "./modules/payments/paypal/paypal.routes.js"
import userRoutes from "./routes/user.routes.js";

const app = express();
const __dirname = import.meta.dirname;
const publicPath = path.join(__dirname, '..', 'public');
const PORT = env.port;

app.use(express.static(publicPath));
app.use(cookieParser());
app.use(
  cors({
    // Allow requests from any origin during development.
    origin: true,
    credentials: true,
  }),
);

// Webhooks must receive the raw request body before JSON parsing.
app.use("/api/v0/payments/razorpay", razorpayRoutes);
app.use("/api/v0/payments/paypal", paypalRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v0/auth", authRoutes);
app.use("/api/v0/products", productRoutes);
app.use("/api/v0/categories", categoryRoutes);
app.use("/api/v0/cart", cartRoutes);
app.use("/api/v0/config", storeConfigRoutes);
app.use("/api/v0/delivery-options", deliveryOptionRoutes);
app.use("/api/v0/discounts", discountRoutes);
app.use("/api/v0/charges", chargeRoutes);
app.use("/api/v0/orders", orderRoutes);
app.use("/api/v0/user", userRoutes);


export const startServer = async () => {
  await connectDb();
  await seedAdminUser();
  initializeStoreConfig();

  //global error handler
  app.use((err, req, res, next) => {
    // Catch Multer-specific errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files!',
          message: 'You can only upload a maximum of 5 images.'
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    // Catch any other general server errors
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong on the server!' });
  });
  app.listen(PORT, () => {
    console.log("app running on port -> " + PORT);
  })
}
export default app;
