FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY gpconnect-user-portal.sln ./
COPY gpconnect-user-portal.Admin/*.csproj ./gpconnect-user-portal.Admin/
COPY gpconnect-user-portal.Console/*.csproj ./gpconnect-user-portal.Console/
COPY gpconnect-user-portal.Core/*.csproj ./gpconnect-user-portal.Core/
COPY gpconnect-user-portal.DAL/*.csproj ./gpconnect-user-portal.DAL/
COPY gpconnect-user-portal.Download/*.csproj ./gpconnect-user-portal.Download/
COPY gpconnect-user-portal.DTO/*.csproj ./gpconnect-user-portal.DTO/
COPY gpconnect-user-portal.Functions/*.csproj ./gpconnect-user-portal.Functions/
COPY gpconnect-user-portal.Helpers/*.csproj ./gpconnect-user-portal.Helpers/
COPY gpconnect-user-portal.Resources/*.csproj ./gpconnect-user-portal.Resources/
COPY gpconnect-user-portal.Services/*.csproj ./gpconnect-user-portal.Services/
COPY gpconnect-user-portal/*.csproj ./gpconnect-user-portal/
COPY gpconnect-user-portal.UnitTests/*.csproj ./gpconnect-user-portal.UnitTests/

RUN dotnet restore
COPY . .
RUN dotnet build -c Debug

FROM build AS test
RUN dotnet test --no-build --logger trx -r test-results || true

FROM scratch as export-test-results
COPY --from=test /src/test-results/*.trx ./

FROM build AS publish
RUN dotnet publish --no-restore -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 80

ENTRYPOINT ["dotnet", "gpconnect-user-portal.dll"]