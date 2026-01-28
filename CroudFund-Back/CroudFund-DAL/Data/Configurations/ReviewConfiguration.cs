using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Data.Configurations
{
    internal class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.HasKey(r => r.Id);
            builder.HasIndex(r => new {r.CampaignId , r.UserId}).IsUnique();

            builder.Property(x => x.Reaction)
                .HasConversion(
                c => c.ToString(),
                c => (Reaction)Enum.Parse(typeof(Reaction), c)
                );

            builder.Property(r => r.Comment)
                .HasMaxLength(500)
                .IsRequired(false);



           
        }
    }
}
