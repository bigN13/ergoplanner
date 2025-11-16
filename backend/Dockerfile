# Development stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development
WORKDIR /app
EXPOSE 80
EXPOSE 443
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV NUGET_PACKAGES=/root/.nuget/packages
ENV NUGET_FALLBACK_PACKAGES=/root/.nuget/fallbackpackages
ENTRYPOINT ["dotnet", "watch", "run", "--project", "src/Ergoplanner.API/Ergoplanner.API.csproj", "--urls", "http://+:80"]

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Ergoplanner.Backend.sln", "./"]
COPY ["src/Ergoplanner.API/Ergoplanner.API.csproj", "src/Ergoplanner.API/"]
COPY ["src/Ergoplanner.Application/Ergoplanner.Application.csproj", "src/Ergoplanner.Application/"]
COPY ["src/Ergoplanner.Domain/Ergoplanner.Domain.csproj", "src/Ergoplanner.Domain/"]
COPY ["src/Ergoplanner.Infrastructure/Ergoplanner.Infrastructure.csproj", "src/Ergoplanner.Infrastructure/"]
COPY ["src/Ergoplanner.Shared/Ergoplanner.Shared.csproj", "src/Ergoplanner.Shared/"]

# Restore packages
RUN dotnet restore

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/src/Ergoplanner.API"
RUN dotnet build "Ergoplanner.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Ergoplanner.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 ergoplanner && \
    useradd -r -u 1000 -g ergoplanner ergoplanner

# Copy published files
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Change to non-root user
USER ergoplanner

# Expose ports
EXPOSE 80
EXPOSE 443

# Start the application
ENTRYPOINT ["dotnet", "Ergoplanner.API.dll"]