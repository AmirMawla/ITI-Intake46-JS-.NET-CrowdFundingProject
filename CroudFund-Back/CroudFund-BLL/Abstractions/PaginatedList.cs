using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Abstractions
{
    public class PaginatedList<T>(List<T> items, int count, int pageNumer, int pageSize)
    {
        public List<T> Items { get; private set; } = items;
        public int PageNumber { get; private set; } = pageNumer;
        public int TotalPages { get; private set; } = (int)Math.Ceiling(count / (double)pageSize);

        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;

        public static async Task<PaginatedList<T>> CreateAsync(IQueryable<T> source, int pageNumer, int pageSize, CancellationToken cancellationToken = default)
        {
            var count = await source.CountAsync(cancellationToken: cancellationToken);

            var items = await source.Skip((pageNumer - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken: cancellationToken);

            return new PaginatedList<T>(items, count, pageNumer, pageSize);
        }
    }
}
