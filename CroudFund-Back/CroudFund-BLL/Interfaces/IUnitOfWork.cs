using CroudFund_BLL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IApplicationUserRepository Users { get; }
        ICampaignRepository Campaigns { get; }

        ICategoryRepository Categories { get; }
        IPledgeRepository Pledges { get; }

        IReviewRepository Reviews { get; }

        ISearchRepository Search { get; }
        Task<int> Complete(CancellationToken cancellationToken = default);

    }
}
