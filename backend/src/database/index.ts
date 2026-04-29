import mongoose from "mongoose";
import { db } from "../config";
import colorsUtils from "../helpers/colorsUtils";
import seedRoles from "../seeds/seedRoles";

// Keep URI as-is and pass dbName separately to avoid malformed Atlas URIs.
const dbURI = db.url;

// additional configuration option for db
const options = {
  dbName: db.name,
  minPoolSize: db.minPoolSize,
  maxPoolSize: db.maxPoolSize,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 45000,
};

mongoose.set("strictQuery", true);

function setRunValidators(this: any): void {
  this.setOptions({ runValidators: true });
}

// create a connection to the database
mongoose
  .plugin((schema: any) => {
    schema.pre("findOneAndUpdate", setRunValidators);
    schema.pre("updateMany", setRunValidators);
    schema.pre("updateOne", setRunValidators);
    schema.pre("update", setRunValidators);
  })
  .connect(dbURI, options)
  .then(() => {
    colorsUtils.log("success", "🛢  mongoose connection done");
  })
  .catch((e) => {
    console.error("mongoose connection error: " + e.message);
  });

// connection events
mongoose.connection.on("connected", () => {
  colorsUtils.log(
    "success",
    "🔗 mongoose connection opened : " + mongoose.connection.host
  );
});

// seed the roles once db is opened
mongoose.connection.once("open", async () => {
  await seedRoles();
});

mongoose.connection.on("disconnected", () => {
  colorsUtils.log("warning", "mongoose connection disconnected");
});

export const connection = mongoose.connection;
