using CroudFund_BLL.Abstractions;
using ServiceProvider_BLL.Dtos.SearchDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Interfaces
{
    public interface ISearchRepository
    {
        Task<Result<IEnumerable<GlobalSearchResponse>>> GlobalSearchAsync(string searchTerm, int maxResultsPerType = 50, CancellationToken cancellationToken = default);
    }
}
