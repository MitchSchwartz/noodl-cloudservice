import mongoose, { Schema, Document, ConnectOptions } from "mongoose";

// Define the schema for the log document
interface LogDocument extends Document {
  level: string;
  message: string;
  timestamp: Date;
}

const logSchema = new Schema({
  level: String,
  message: String,
  timestamp: Date,
});

// Create the Mongoose model for the log document
const LogModel = mongoose.model<LogDocument>("Log", logSchema);

// Create a logger that will push to MongoDB
export class LoggerAdapter {
  constructor(options: { databaseURI: string }) {
    // Connect to MongoDB
    mongoose
      .connect(options.databaseURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as ConnectOptions)
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
      });
  }

  log(...args: any[]) {
    console.log.apply(this, args);
  }

  // Log function using Mongoose model
  async _log(level: string, message: string) {
    try {
      const logEntry = new LogModel({
        level,
        message,
        timestamp: new Date(),
      });
      await logEntry.save();
    } catch (error) {
      console.error("Error saving log:", error);
    }
  }

  // Custom query using Mongoose model
  async query(
    options: {
      from?: Date;
      until?: Date;
      size?: number;
      order?: string;
      level?: string;
    },
    callback: (results: LogDocument[]) => void = () => {}
  ) {
    const {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      until = new Date(),
      size = 10,
      level = "info",
    } = options;

    try {
      const queryOptions = {
        timestamp: { $gte: from, $lte: until },
        level,
      };

      const results = await LogModel.find(queryOptions)
        .limit(size)
        .sort({ timestamp: -1 }); // Sorting by timestamp in descending order

      callback(results);
      return results;
    } catch (error) {
      console.error("Error querying logs:", error);
      callback([]);
      return [];
    }
  }
}
