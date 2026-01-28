using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Dtos.CategoryDto
{
    public class CategoryRequestValidator : AbstractValidator<CategoryRequest>
    {
        public CategoryRequestValidator() 
        {
            RuleFor(x => x.Name)
               .NotEmpty().WithMessage("Category name is required")
               .MinimumLength(3).WithMessage("Category name must be at least 3 characters")
               .MaximumLength(50).WithMessage("Category name cannot exceed 50 characters");
        }
    }
}
