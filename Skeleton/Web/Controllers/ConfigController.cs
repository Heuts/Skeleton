using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

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
        public WebConfig Index()
        {
            return new WebConfig
            {
                ApiServerUrl = config["ApiServer:SchemeAndHost"],
            };
        }

        public class WebConfig
        {
            public string ApiServerUrl;
        }
    }
}