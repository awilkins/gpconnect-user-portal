﻿using Dapper.FluentMap.Mapping;
using gpconnect_user_portal.DTO.Response.Configuration;

namespace gpconnect_user_portal.DAL.Mapping
{
    public class GeneralConfigurationMap : EntityMap<General>
    {
        public GeneralConfigurationMap()
        {
            Map(p => p.ProductName).ToColumn("product_name");
            Map(p => p.ProductVersion).ToColumn("product_version");
        }
    }
}
