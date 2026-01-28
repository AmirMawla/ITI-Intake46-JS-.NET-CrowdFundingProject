using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.AuthenticationDto
{
    public class LogInRequestValidator : AbstractValidator<LogInRequest>    
    {
        public LogInRequestValidator() 
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress();

            RuleFor(x => x.Password)
              .NotEmpty();
        }
    }
}
