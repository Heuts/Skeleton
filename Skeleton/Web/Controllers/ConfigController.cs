using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Web.DTO;

namespace Web.Controllers.Configuration
{
    [Route("api/Config")]
    public class ConfigController : Controller
    {
        private IConfiguration config;

        public ConfigController(IConfiguration configuration)
        {
            config = configuration;
        }

        [HttpGet]
        public ConfigDto Index()
        {
            return new ConfigDto
            {
                ApiServerUrl = config["ApiServer:SchemeAndHost"],
            };
        }
    }
}