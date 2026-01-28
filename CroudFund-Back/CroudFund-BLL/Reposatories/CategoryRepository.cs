using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Dtos.CategoryDto;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Reposatories;

public class CategoryRepository(AppDbContext context) : BaseRepository<Category>(context), ICategoryRepository
{
    private readonly AppDbContext _context = context;

    public async Task<Result<CategoryResponse>> CreateCategory(CategoryRequest request, CancellationToken cancellationToken = default)
    {
        // Check if category name already exists
        var nameExists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower(), cancellationToken);

        if (nameExists)
            return Result.Failure<CategoryResponse>(CategoryErrors.NameAlreadyExists);

        // Create new category
        var category = new Category
        {
            Name = request.Name,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Categories.AddAsync(category, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Return created category
        var createdCategory = new CategoryResponse(
            category.Id,
            category.Name,
            category.CreatedAt,
            0 // New category has no campaigns
        );

        return Result.Success(createdCategory);
    }

    public async Task<Result> DeleteCategory(int categoryId, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
                 .Include(c => c.Campaigns)
                 .FirstOrDefaultAsync(c => c.Id == categoryId, cancellationToken);

        if (category is null)
            return Result.Failure(CategoryErrors.NotFound);

        // Check if category has campaigns
        if (category.Campaigns.Any())
            return Result.Failure(CategoryErrors.CannotDeleteWithCampaigns);

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<IEnumerable<CategoryResponse>>> GetAllCategories(CancellationToken cancellationToken = default)
    {
        var categories = await _context.Categories!
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponse(
                    c.Id,
                    c.Name,
                    c.CreatedAt,
                    c.Campaigns.Count
                ))
                .AsNoTracking()
                .ToListAsync(cancellationToken);

        if (categories.Count == 0)
            return Result.Failure<IEnumerable<CategoryResponse>>(CategoryErrors.NoCategoriesFound);

        return Result.Success<IEnumerable<CategoryResponse>>(categories);
    }

    public async Task<Result<CategoryResponse>> GetCategoryById(int categoryId, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
                .Where(c => c.Id == categoryId)
                .Select(c => new CategoryResponse(
                    c.Id,
                    c.Name,
                    c.CreatedAt,
                    c.Campaigns.Count
                ))
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

        if (category is null)
            return Result.Failure<CategoryResponse>(CategoryErrors.NotFound);

        return Result.Success(category);
    }

    public async Task<Result> UpdateCategory(int categoryId, CategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
               .FirstOrDefaultAsync(c => c.Id == categoryId, cancellationToken);

        if (category is null)
            return Result.Failure(CategoryErrors.NotFound);

        // Check if new name already exists (excluding current category)
        var nameExists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == request.Name.ToLower() && c.Id != categoryId, cancellationToken);

        if (nameExists)
            return Result.Failure(CategoryErrors.NameAlreadyExists);

        // Update category
        category.Name = request.Name;

        _context.Categories.Update(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
