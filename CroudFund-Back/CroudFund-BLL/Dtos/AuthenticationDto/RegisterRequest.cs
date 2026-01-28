using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.AuthenticationDto
{
    public record RegisterationRequest(

        string FullName ,
        string Email,
        string Password
        
    );

}
