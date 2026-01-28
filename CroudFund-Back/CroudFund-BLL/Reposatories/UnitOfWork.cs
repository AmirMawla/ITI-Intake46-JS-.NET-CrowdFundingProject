
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServiceProvider_BLL.Reposatories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly UserManager<ApplicationUser> _usermanager;
        private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
        private readonly IWebHostEnvironment _env;
        public IApplicationUserRepository Users { get; private set; }
        public IReviewRepository Reviews { get; private set; }

        public ICampaignRepository Campaigns { get; private set; }

        public ICategoryRepository Categories { get; private set; }


        public IPledgeRepository Pledges { get; private set; }


        public ISearchRepository Search { get; private set; }


        public UnitOfWork(AppDbContext context, IHttpContextAccessor httpContextAccessor, UserManager<ApplicationUser> userManager, IPasswordHasher<ApplicationUser> passwordHasher, IWebHostEnvironment env)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _usermanager = userManager;
            _passwordHasher = passwordHasher;
            _env = env;

            Users = new ApplicationUserRepository(_context , _usermanager , _env);

            Campaigns = new CampaignRepository(_context, _env);

            Categories = new CategoryRepository(_context);

            Reviews = new ReviewRepository(_context);

            Pledges = new PledgeRepository(_context);

            Search = new SearchRepository(_context);
            _env = env;
        }

        public async Task<int> Complete(CancellationToken cancellationToken = default) =>
            await _context.SaveChangesAsync(cancellationToken);

        public void Dispose() =>
            _context.Dispose();
    }
}
