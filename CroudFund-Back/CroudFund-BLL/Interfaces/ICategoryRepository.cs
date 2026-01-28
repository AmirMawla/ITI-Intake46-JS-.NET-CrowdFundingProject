using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.CategoryDto;
using CroudFund_DAL.Entities;
using CroudFund_BLL.Dtos.CategoryDto;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Interfaces;

public interface ICategoryRepository : IBaseRepository<Category>
{
    Task<Result<IEnumerable<CategoryResponse>>> GetAllCategories(CancellationToken cancellationToken = default);
    Task<Result<CategoryResponse>> GetCategoryById(int categoryId, CancellationToken cancellationToken = default);
    Task<Result<CategoryResponse>> CreateCategory(CategoryRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateCategory(int categoryId, CategoryRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteCategory(int categoryId, CancellationToken cancellationToken = default);
}

