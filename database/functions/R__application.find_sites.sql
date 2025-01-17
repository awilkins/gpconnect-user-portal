drop function if exists application.find_sites;

create function application.find_sites
(
	_site_definition_status smallint,
	_html_query_filter_interaction varchar(100),
	_structured_query_filter_interaction varchar(100),
	_appointment_query_filter_interaction varchar(100),
	_send_document_query_filter_interaction varchar(100),
	_filter_by bigint default null,
	_site_ods_code varchar(1000) default null,
	_site_name varchar(1000) default null,
	_ccg_ods_code varchar(50) default null,
	_ccg_name varchar(100) default null	
)
returns table
(
	site_definition_id integer,
	site_ods_code varchar(500),
	site_unique_identifier uuid,
	site_definition_status_id smallint,
	site_interactions varchar(4000),
	site_name varchar(4000),
	selected_ccg_ods_code varchar(4000),
	selected_ccg_name varchar(4000),
	is_appointment_enabled boolean,
	is_html_enabled boolean,
	is_structured_enabled boolean,
	is_send_document_enabled boolean,
	site_postcode varchar(4000),
	ods_code varchar(4000),
	selected_supplier varchar(4000),
	use_case_description varchar(4000)
)
as $$
begin
	return query
	select
		*
	from (
		select 
			a.site_definition_id,
			a.site_ods_code,
			a.site_unique_identifier,
			a.site_definition_status_id,
			a.site_interactions,
			a.sitename,
			a.selectedccgodscode,
			a.selectedccgname,
			a.isappointmentenabled,
			a.ishtmlenabled,
			a.isstructuredenabled,
			a.issenddocumentenabled,
			a.sitepostcode,
			a.odscode,
			a.selectedsupplier,
			a.usecasedescription
		from (
			select
				sd.site_definition_id, 
				sd.site_ods_code,		
				sd.site_unique_identifier,
				sd.site_definition_status_id,
				sd.site_interactions,
				json_object_agg(sa.site_attribute_name, sa.site_attribute_value) site_attributes_json,
				(json_populate_record(null::"application".site_attributes_type, json_object_agg(lower(sa.site_attribute_name), coalesce(l.lookup_value, sa.site_attribute_value)))).*
			from
				application.site_attribute sa
				inner join application.site_definition sd on sa.site_definition_id = sd.site_definition_id
				left outer join reference.lookup l on sa.site_attribute_value = l.lookup_id::varchar
			where
				sd.site_definition_status_id = _site_definition_status
			group by
				sd.site_definition_id
			order by
				sd.site_definition_id
		) a
		where
			(_site_ods_code is null or a.site_ods_code ~* _site_ods_code) and
			(_site_name is null or a.sitename ~* _site_name) and
			(_ccg_ods_code is null or position(_ccg_ods_code in a.selectedccgodscode) > 0) and
			(_ccg_name is null or position(_ccg_name in a.selectedccgname) > 0)
			) b
		where case 
			when _filter_by is null then 1=1
			when _filter_by = 0 then 1=1
			when _filter_by = 1 then position(_html_query_filter_interaction in b.site_interactions) = 0 
			when _filter_by = 2 then position(_html_query_filter_interaction in b.site_interactions) > 0
			when _filter_by = 3 then position(_structured_query_filter_interaction in b.site_interactions) = 0
			when _filter_by = 4 then position(_structured_query_filter_interaction in b.site_interactions) > 0
			when _filter_by = 5 then position(_appointment_query_filter_interaction in b.site_interactions) = 0
			when _filter_by = 6 then position(_appointment_query_filter_interaction in b.site_interactions) > 0
			when _filter_by = 7 then position(_send_document_query_filter_interaction in b.site_interactions) = 0
			when _filter_by = 8 then position(_send_document_query_filter_interaction in b.site_interactions) > 0
		end;
end;
$$ language plpgsql;