using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Ergoplanner.Application.Common.Models
{
    /// <summary>
    /// Represents a paginated list of items
    /// </summary>
    public class PagedList<T>
    {
        public List<T> Items { get; }
        public int PageNumber { get; }
        public int PageSize { get; }
        public int TotalCount { get; }
        public int TotalPages { get; }
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
        public int FirstItemIndex => (PageNumber - 1) * PageSize + 1;
        public int LastItemIndex => Math.Min(PageNumber * PageSize, TotalCount);

        public PagedList(List<T> items, int count, int pageNumber, int pageSize)
        {
            Items = items;
            TotalCount = count;
            PageNumber = pageNumber;
            PageSize = pageSize;
            TotalPages = (int)Math.Ceiling(count / (double)pageSize);
        }

        /// <summary>
        /// Create a paginated list from a queryable source
        /// </summary>
        public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = await source.CountAsync();
            var items = await source
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedList<T>(items, count, pageNumber, pageSize);
        }

        /// <summary>
        /// Create a paginated list from an enumerable source (synchronous)
        /// </summary>
        public static PagedList<T> Create(IEnumerable<T> source, int pageNumber, int pageSize)
        {
            var enumerable = source as List<T> ?? source.ToList();
            var count = enumerable.Count;
            var items = enumerable
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedList<T>(items, count, pageNumber, pageSize);
        }

        /// <summary>
        /// Map the items in the paged list to a different type
        /// </summary>
        public PagedList<TDestination> Map<TDestination>(Func<T, TDestination> mapper)
        {
            var mappedItems = Items.Select(mapper).ToList();
            return new PagedList<TDestination>(mappedItems, TotalCount, PageNumber, PageSize);
        }
    }

    /// <summary>
    /// Common pagination request parameters
    /// </summary>
    public class PaginationParams
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;

        public int PageNumber { get; set; } = 1;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }

        public string? OrderBy { get; set; }
        public bool OrderByDescending { get; set; } = false;
        public string? SearchTerm { get; set; }
    }

    /// <summary>
    /// Response wrapper for paginated results
    /// </summary>
    public class PagedResponse<T>
    {
        public List<T> Data { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }

        public PagedResponse(PagedList<T> pagedList)
        {
            Data = pagedList.Items;
            PageNumber = pagedList.PageNumber;
            PageSize = pagedList.PageSize;
            TotalCount = pagedList.TotalCount;
            TotalPages = pagedList.TotalPages;
            HasPreviousPage = pagedList.HasPreviousPage;
            HasNextPage = pagedList.HasNextPage;
        }
    }

    /// <summary>
    /// Extension methods for pagination
    /// </summary>
    public static class PaginationExtensions
    {
        /// <summary>
        /// Apply pagination to a queryable
        /// </summary>
        public static IQueryable<T> Paginate<T>(this IQueryable<T> query, int pageNumber, int pageSize)
        {
            return query.Skip((pageNumber - 1) * pageSize).Take(pageSize);
        }

        /// <summary>
        /// Convert PagedList to PagedResponse
        /// </summary>
        public static PagedResponse<T> ToPagedResponse<T>(this PagedList<T> pagedList)
        {
            return new PagedResponse<T>(pagedList);
        }
    }
}