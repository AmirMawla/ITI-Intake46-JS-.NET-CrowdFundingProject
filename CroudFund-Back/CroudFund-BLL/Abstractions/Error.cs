namespace CroudFund_BLL.Abstractions
{
    public record Error(string code , string description, int? StatusCode)
    {
        public static readonly Error None = new(string.Empty, string.Empty,null);
    }
}
