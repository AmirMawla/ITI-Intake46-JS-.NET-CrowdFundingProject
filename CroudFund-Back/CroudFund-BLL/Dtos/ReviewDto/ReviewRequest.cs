using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.ReviewDto
{
    public record ReviewRequest(
         string Comment ,
         Reaction? Reaction
        );

}
