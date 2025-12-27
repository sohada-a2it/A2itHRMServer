// seedAdmin.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    console.log("Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const seedAdmin = async () => {
  try {
    // Import the User model
    const User = require("../models/UsersModel");
    
    console.log("\n=== Creating Admin User ===");
    
    // Hash password manually (since we'll use raw insert)
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    
    // Prepare admin data according to your schema
const adminData = {
  firstName: "Super",
  lastName: "Admin",
  email: "shohana@gmail.com",
  password: hashedPassword,
  role: "admin",
  isActive: true,
  status: "active",
  department: "Administration",
  designation: "System Admin",
  phone: "01700000000",
  AdminId: "ADMIN-001",
  picture: "https://example.com/default-avatar.png",
  createdAt: new Date(),
  updatedAt: new Date()
};
    
    console.log("Admin data to insert:", adminData);
    
    // Method 1: Direct MongoDB insert (bypasses pre-save hook)
    const db = mongoose.connection.db;
    
    // Check if admin already exists
    const existingAdmin = await db.collection("users").findOne({ 
      email: "admin@gmail.com" 
    });
    
    if (existingAdmin) {
      console.log("\n⚠️ Admin already exists. Updating...");
      
      await db.collection("users").updateOne(
        { email: "admin@gmail.com" },
        { $set: adminData }
      );
      
      console.log("✅ Admin updated successfully!");
    } else {
      console.log("\nCreating new admin...");
      
      await db.collection("users").insertOne(adminData);
      
      console.log("✅ Admin created successfully!");
    }
    
    // Verify
    const createdAdmin = await db.collection("users").findOne({ 
      email: "shohana@gmail.com" 
    });
    
    console.log("\n=== Verification ===");
    console.log("Email:", createdAdmin.email);
    console.log("Role:", createdAdmin.role);
    console.log("Name:", createdAdmin.name);
    
    process.exit();
  } catch (err) {
    console.error("\n❌ Error seeding admin:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
};

// Run after connection is established
mongoose.connection.once("open", () => {
  seedAdmin();
});