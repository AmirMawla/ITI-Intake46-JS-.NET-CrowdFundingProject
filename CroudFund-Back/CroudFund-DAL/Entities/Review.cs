using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Entities
{

   public  enum Reaction {
        Like =1 ,
        Love =2 ,
        Support =3 
    }

    public class Review
    {
        public int Id { get; set; }
        public string Comment { get; set; } = string.Empty;
        public Reaction? Reaction { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string UserId { get; set; } = string.Empty ;
        public int CampaignId { get; set; }

        public virtual ApplicationUser User { get; set; } = default!;
        public virtual Campaign Campaign { get; set; } = default!;
    }
}
