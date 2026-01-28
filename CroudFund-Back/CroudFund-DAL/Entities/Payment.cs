using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Entities
{
    public enum PaymentStatus
    {
        Pending = 1,
        Success = 2,
        Failed = 3
    }
    public class Payment
    {
        public int Id { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;

        public string PaymentMethod { get; set; } = string.Empty;

        public int PledgeId { get; set; }

        public virtual Pledge Pledge { get; set; } = default!;

    }
}
