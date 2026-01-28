using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole ,string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            var cascadeFKs = builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetForeignKeys())
            .Where(fk => !fk.IsOwnership && fk.DeleteBehavior == DeleteBehavior.Cascade);

            foreach (var fk in cascadeFKs)
                fk.DeleteBehavior = DeleteBehavior.Restrict;

            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }



        
        public DbSet<Pledge>? Pledges { get; set; }
        public DbSet<Campaign>? Campaigns { get; set; }
        public DbSet<Category>? Categories { get; set; }
        public DbSet<Payment>? Payments { get; set; }
        public DbSet<Review>? Reviews { get; set; }
        

    }
}
