using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_DAL.Entities
{
    public class ApplicationUser  : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string ProfileImage { get; set; } = "/images/users/0684456b-aa2b-4631-86f7-93ceaf33303c.jpg";
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;


        public virtual ICollection<Campaign> Campaigns { get; set; } = [];
        public virtual ICollection<Review> Reviews { get; set; } = [];
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    }
}
