using Microsoft.AspNetCore.Http;
using CroudFund_BLL.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Errors
{
    public static class CategoryErrors
    {
        public static readonly Error NotFound = new("Category.NotFound", "The specified category was not found.", 404);
        public static readonly Error NoCategoriesFound = new("Category.NoCategoriesFound", "No categories found.", 404);
        public static readonly Error CreateFailed = new("Category.CreateFailed", "Failed to create category.", 400);
        public static readonly Error UpdateFailed = new("Category.UpdateFailed", "Failed to update category.", 400);
        public static readonly Error DeleteFailed = new("Category.DeleteFailed", "Failed to delete category.", 400);
        public static readonly Error NameAlreadyExists = new("Category.NameAlreadyExists", "A category with this name already exists.", 409);
        public static readonly Error CannotDeleteWithCampaigns = new("Category.CannotDeleteWithCampaigns", "Cannot delete category that has campaigns.", 400);
    }
}
