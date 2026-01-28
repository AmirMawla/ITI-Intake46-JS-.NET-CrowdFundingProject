using CroudFund_DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Data.Configurations
{
    public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
    {
        public void Configure(EntityTypeBuilder<Campaign> builder)
        {
            builder.HasKey(u => u.Id);


            builder.Property(u => u.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(u => u.Description)
                .HasMaxLength(3000)
                .IsRequired();


            builder.Property(u => u.GoalAmount)
                .HasColumnType("decimal")
                .IsRequired();

            
        }
    }
}
