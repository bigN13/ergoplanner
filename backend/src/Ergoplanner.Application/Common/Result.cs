namespace Ergoplanner.Application.Common
{
    /// <summary>
    /// Represents the result of an operation with success/failure state
    /// </summary>
    /// <typeparam name="T">The type of the result value</typeparam>
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Value { get; }
        public string Error { get; }
        public string ErrorCode { get; }
        public Dictionary<string, string[]> ValidationErrors { get; }

        protected Result(bool isSuccess, T? value, string error = "", string errorCode = "", Dictionary<string, string[]>? validationErrors = null)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
            ErrorCode = errorCode;
            ValidationErrors = validationErrors ?? new Dictionary<string, string[]>();
        }

        public static Result<T> Success(T value)
        {
            return new Result<T>(true, value);
        }

        public static Result<T> Failure(string error, string errorCode = "")
        {
            return new Result<T>(false, default(T), error, errorCode);
        }

        public static Result<T> ValidationFailure(Dictionary<string, string[]> validationErrors)
        {
            return new Result<T>(false, default(T), "Validation failed", "VALIDATION_ERROR", validationErrors);
        }
    }

    /// <summary>
    /// Non-generic Result for operations that don't return a value
    /// </summary>
    public class Result
    {
        public bool IsSuccess { get; }
        public string Error { get; }
        public string ErrorCode { get; }
        public Dictionary<string, string[]> ValidationErrors { get; }

        protected Result(bool isSuccess, string error = "", string errorCode = "", Dictionary<string, string[]>? validationErrors = null)
        {
            IsSuccess = isSuccess;
            Error = error;
            ErrorCode = errorCode;
            ValidationErrors = validationErrors ?? new Dictionary<string, string[]>();
        }

        public static Result Success()
        {
            return new Result(true);
        }

        public static Result Failure(string error, string errorCode = "")
        {
            return new Result(false, error, errorCode);
        }

        public static Result ValidationFailure(Dictionary<string, string[]> validationErrors)
        {
            return new Result(false, "Validation failed", "VALIDATION_ERROR", validationErrors);
        }
    }
}