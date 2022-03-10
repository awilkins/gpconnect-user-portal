drop function if exists configuration.get_logging_configuration;

create function configuration.get_logging_configuration
(
)
returns table
(
	token character varying(1000),
	channel uuid,
	index character varying(100),
	server_url character varying(500),
	source character varying(100),
	source_type character varying(100),
	use_proxy bool,
	proxy_user character varying(100),
	proxy_password character varying(100)
)
as $$
begin
	return query
	select
		l.token, 
		l.channel, 
		l.index, 
		l.server_url, 
		l.source, 
		l.source_type, 
		l.use_proxy, 
		l.proxy_user, 
		l.proxy_password
	from configuration.logging l;	
end;
$$ language plpgsql;