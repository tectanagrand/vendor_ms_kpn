CREATE TABLE public.mat_item_group (
	id serial4 NOT NULL,
	code varchar(10) NOT NULL,
	name varchar(100) NULL,
	created_at date NOT NULL,
	updated_at date NOT NULL,
	created_by varchar(100) NULL,
	updated_by varchar(100) NULL,
	deleted_at timestamp NULL,
	deleted_by varchar(100) NULL,
	CONSTRAINT mat_item_group_code_key UNIQUE (code),
	CONSTRAINT mat_item_group_pkey PRIMARY KEY (id)
);

-- public.mat_item_sub_group definition

-- Drop table

-- DROP TABLE public.mat_item_sub_group;

CREATE TABLE public.mat_item_sub_group (
	id serial4 NOT NULL,
	code varchar(10) NOT NULL,
	"name" varchar(100) NULL,
	item_group_id int4 NOT NULL,
	created_at date NOT NULL,
	updated_at date NOT NULL,
	created_by varchar(100) NULL,
	updated_by varchar(100) NULL,
	deleted_at timestamp NULL,
	deleted_by varchar(100) NULL,
	CONSTRAINT mat_item_sub_group_code_item_group_id_key UNIQUE (code, item_group_id),
	CONSTRAINT mat_item_sub_group_pkey PRIMARY KEY (id)
);


-- public.mat_item_sub_group foreign keys

ALTER TABLE public.mat_item_sub_group ADD CONSTRAINT mat_item_sub_group_item_group_id_fkey FOREIGN KEY (item_group_id) REFERENCES public.mat_item_group(id);

-- public.mat_sap_data definition

-- Drop table

-- DROP TABLE public.mat_sap_data;

CREATE TABLE public.mat_sap_data (
	id serial4 NOT NULL,
	code varchar(100) NOT NULL,
	"name" varchar(100) NULL,
	description varchar(100) NULL,
	long_text text NULL,
	image varchar(100) NULL,
	"type" varchar(40) NULL,
	maintenance_status varchar(40) NULL,
	unit_of_measurement varchar(40) NULL,
	alias1 varchar(40) NULL,
	alias2 varchar(40) NULL,
	alias3 varchar(40) NULL,
	filter_code_1 varchar(3) NULL,
	filter_code_2 varchar(3) NULL,
	material_sub_group_id int4 NOT NULL,
	created_by varchar(100) NULL,
	updated_by varchar(100) NULL,
	created_at date NOT NULL,
	updated_at date NOT NULL,
	dffromclient bool NULL,
	CONSTRAINT mat_sap_data_code_key UNIQUE (code),
	CONSTRAINT mat_sap_data_pkey PRIMARY KEY (id)
);

CREATE INDEX mat_sap_data_search_idx ON public.mat_sap_data USING gin (to_tsvector('english'::regconfig, (((((((((((((COALESCE(name, ''::character varying))::text || ' '::text) || (COALESCE(description, ''::character varying))::text) || ' '::text) || COALESCE(long_text, ''::text)) || ' '::text) || (COALESCE(alias1, ''::character varying))::text) || ' '::text) || (COALESCE(alias2, ''::character varying))::text) || ' '::text) || (COALESCE(alias3, ''::character varying))::text) || ' '::text) || (COALESCE(code, ''::character varying))::text)));


-- public.mat_sap_data foreign keys

ALTER TABLE public.mat_sap_data ADD CONSTRAINT mat_sap_data_material_sub_group_id_fkey FOREIGN KEY (material_sub_group_id) REFERENCES public.mat_item_sub_group(id);

-- public.mat_attachment definition

-- Drop table

-- DROP TABLE public.mat_attachment;

CREATE TABLE public.mat_attachment (
	id serial4 NOT NULL,
	attachment varchar(100) NULL,
	"type" varchar(50) NULL,
	material_id int4 NOT NULL,
	created_at date NOT NULL,
	updated_at date NOT NULL,
	CONSTRAINT mat_attachment_pkey PRIMARY KEY (id)
);


-- public.mat_attachment foreign keys

ALTER TABLE public.mat_attachment ADD CONSTRAINT mat_attachment_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.mat_sap_data(id);

-- Add deleted_at and deleted_by columns to mat_item_group
ALTER TABLE public.mat_item_group
ADD COLUMN deleted_at timestamp NULL,
ADD COLUMN deleted_by varchar(100) NULL;

-- Add deleted_at and deleted_by columns to mat_item_sub_group
ALTER TABLE public.mat_item_sub_group
ADD COLUMN deleted_at timestamp NULL,
ADD COLUMN deleted_by varchar(100) NULL;