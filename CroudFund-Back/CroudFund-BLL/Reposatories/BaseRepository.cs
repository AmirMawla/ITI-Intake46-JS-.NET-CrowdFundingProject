using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Reposatories
{
    public class BaseRepository<T> :IBaseRepository<T> where T : class
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;

        public BaseRepository(AppDbContext _context)
        {
            this._context = _context;
            _dbSet = _context.Set<T>();
        }

        public async Task<Result> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> RemoveAsync(int id)
        {
            var entity = await _dbSet.FindAsync(id);
            if (entity is null)
                return Result.Failure(new Error("Not Found",$"Entity with id {id} wasn't found",StatusCodes.Status404NotFound));

            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();

            return Result.Success();

        }

        public async Task<Result<IEnumerable<T>>> GetAllAsync()
        {
           var entities =  await _dbSet.AsNoTracking().ToListAsync();

                return entities is null || !entities.Any()
                ? Result.Failure<IEnumerable<T>>(new Error("Not Found", "no entities found",StatusCodes.Status404NotFound))
                :Result.Success<IEnumerable<T>>(entities);
        }
        public async Task<Result<T>> GetByIdAsync(int id)
        {
             var entity = await _dbSet.FindAsync(id);
             
            return entity is null
                ?Result.Failure<T>(new Error("Not Found","entity was't found", StatusCodes.Status404NotFound))
                :Result.Success(entity);
        }
        public async Task<Result<T>> FindByExpress(Expression<Func<T, bool>> Criteria)
        {
           var entity =  await _dbSet.SingleOrDefaultAsync(Criteria);

            return entity is null
               ? Result.Failure<T>(new Error("Not Found", "entity was't found", StatusCodes.Status404NotFound))
               : Result.Success(entity);
        }
        public async Task<Result<IEnumerable<T>>> FindAllByExpress(Expression<Func<T, bool>> Criteria)
        {
           var entities = await _dbSet.Where(Criteria).ToListAsync();

            return entities is null ?
                Result.Failure<IEnumerable<T>>(new Error("Not Found", "no entities found", StatusCodes.Status404NotFound))
                :Result.Success<IEnumerable<T>>(entities);
        }
        public async Task<Result<IEnumerable<T>>> GetAllWithIncludeAsync(params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            var result = await query.ToListAsync();

            return Result.Success<IEnumerable<T>>(result);
        }

        public async Task<Result<T>> GetFirstOrDefaultWithIncludeAsync(Expression<Func<T, bool>> filter, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            var result = await query.FirstOrDefaultAsync(filter);
            return result is null ?
                Result.Failure<T>(new Error("Not Found","no entities found", StatusCodes.Status404NotFound))
                :Result.Success(result);
        }

        public async Task<bool> AnyAsync(Expression<Func<T, bool>> filter)
        {
            return await _dbSet.AnyAsync(filter);
        }

        

    }
}
