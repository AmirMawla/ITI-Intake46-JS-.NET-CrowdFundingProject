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
    internal class  PledgeConfiguration : IEntityTypeConfiguration<Pledge>
    {
        public void Configure(EntityTypeBuilder<Pledge> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(u => u.Amount)
                .HasColumnType("decimal")
                .IsRequired();
        }
    }
}
