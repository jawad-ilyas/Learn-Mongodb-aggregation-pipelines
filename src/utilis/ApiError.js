class ApiError extends Error {
    constructor(
        statusCode, // HTTP status code associated with the error
        message = "Something went wrong", // Error message (default: "Something went wrong")
        errors = [], // Array containing additional error details or validation errors
        stack = "" // Stack trace (optional)
    ) {
        // Call the Error class constructor with the provided message
        super(message);

        // Assign properties specific to the ApiError class
        this.statusCode = statusCode; // Assign the HTTP status code
        this.data = null; // Additional data related to the error (currently set to null)
        this.success = false; // Indicates whether the operation was successful (set to false for errors)
        this.errors = errors; // Array containing additional error details or validation errors

        // Check if a stack trace is provided
        if (stack) {
            // If provided, set the stack property to the provided stack trace
            this.stack = stack;
        } else {
            // If not provided, capture the stack trace and assign it to the stack property
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
