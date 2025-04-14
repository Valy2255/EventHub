--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text NOT NULL,
    venue character varying(255) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    end_time time without time zone,
    image_url character varying(255),
    min_price numeric(10,2),
    max_price numeric(10,2),
    organizer_id integer,
    category_id integer,
    cancellation_policy text,
    featured boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    subcategory_id integer,
    views integer DEFAULT 0
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: payment_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_tickets (
    payment_id integer NOT NULL,
    ticket_id integer NOT NULL
);


ALTER TABLE public.payment_tickets OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    user_id integer,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'RON'::character varying,
    payment_method character varying(50) NOT NULL,
    transaction_id character varying(255),
    status character varying(20) NOT NULL,
    refund_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer,
    event_id integer,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_accounts (
    id integer NOT NULL,
    user_id integer,
    provider character varying(20) NOT NULL,
    provider_id character varying(255) NOT NULL,
    provider_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.social_accounts OWNER TO postgres;

--
-- Name: social_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.social_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.social_accounts_id_seq OWNER TO postgres;

--
-- Name: social_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.social_accounts_id_seq OWNED BY public.social_accounts.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    category_id integer,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subcategories OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subcategories_id_seq OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_types (
    id integer NOT NULL,
    event_id integer,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    available_quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_types OWNER TO postgres;

--
-- Name: ticket_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ticket_types_id_seq OWNER TO postgres;

--
-- Name: ticket_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_types_id_seq OWNED BY public.ticket_types.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_type_id integer,
    user_id integer,
    event_id integer,
    qr_code text,
    price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'reserved'::character varying NOT NULL,
    purchase_date timestamp with time zone,
    reservation_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    checked_in boolean DEFAULT false,
    checked_in_at timestamp with time zone,
    refund_status character varying(20) DEFAULT NULL::character varying,
    cancelled_at timestamp with time zone
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    user_id integer NOT NULL,
    preferred_categories integer[] DEFAULT '{}'::integer[],
    location_latitude numeric(10,8),
    location_longitude numeric(11,8),
    notification_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    profile_image character varying(255),
    google_id character varying(255),
    facebook_id character varying(255),
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reset_token character varying(255),
    reset_token_expire timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: social_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_accounts ALTER COLUMN id SET DEFAULT nextval('public.social_accounts_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: ticket_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_types ALTER COLUMN id SET DEFAULT nextval('public.ticket_types_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, created_at) FROM stdin;
1	Concerts	concerts	Live concerts from all music genres	2025-03-24 19:16:45.994939+02
2	Sports	sports	Local and international sporting events	2025-03-24 19:16:45.994939+02
4	Festivals	festivals	Music, film, art and cultural festivals	2025-03-24 19:16:45.994939+02
3	Theater & Comedy	theater-comedy	Theater performances, stand-up comedy and improvisation	2025-03-24 19:16:45.994939+02
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, name, slug, description, venue, address, city, latitude, longitude, date, "time", end_time, image_url, min_price, max_price, organizer_id, category_id, cancellation_policy, featured, status, created_at, updated_at, subcategory_id, views) FROM stdin;
2	AC/DC Concert	acdc-concert	Rock legends AC/DC in concert in Romania	Cluj Arena	Stadium Alley 2	Cluj-Napoca	46.76863450	23.57170210	2025-06-10	20:00:00	23:30:00	https://placehold.co/600x400/purple/white?text=AC/DC	300.00	1000.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.635973+02	2025-03-24 19:19:50.635973+02	1	10
22	Travis Scott Astroworld	travis-scott-astroworld	Travis Scott - Astroworld Tour	Sala Polivalenta	Strada Uzinei Electrice 2	Iasi	47.15845490	27.60144180	2025-10-05	20:00:00	23:30:00	https://placehold.co/600x400/purple/white?text=Travis+Scott	300.00	1100.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	4	2
8	David Guetta Live	david-guetta-live	David Guetta - electronic music superstar	Romexpo	Marasti Boulevard 65-67	Bucharest	44.47618240	26.06508930	2025-07-12	22:00:00	04:00:00	https://placehold.co/600x400/purple/white?text=David+Guetta	250.00	800.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.653364+02	2025-03-24 19:19:50.653364+02	3	6
26	Mozart Tribute Concert	mozart-tribute	A Night Celebrating Mozarts Compositions	Sala Thalia	Strada Alexandru Ioan Cuza 19	Cluj-Napoca	46.58073400	23.77383590	2025-12-15	18:30:00	21:00:00	https://placehold.co/600x400/gold/black?text=Mozart+Tribute	120.00	400.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	5	8
28	Imagine Dragons Night	imagine-dragons-night	Imagine Dragons - Evolve Tour	Stadionul Municipal	Strada Evolve 3	Cluj-Napoca	46.77121010	23.62363530	2026-02-05	19:00:00	22:00:00	https://placehold.co/600x400/orange/white?text=Imagine+Dragons	290.00	1050.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	2	0
6	Taylor Swift Concert	taylor-swift-concert	Taylor Swift - The Eras Tour	National Arena	Pierre de Coubertin Boulevard 3-5	Bucharest	44.44134320	26.15116380	2025-06-20	19:00:00	23:30:00	https://placehold.co/600x400/purple/white?text=Taylor+Swift	400.00	1500.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.647518+02	2025-03-24 19:19:50.647518+02	2	4
7	Untold Festival 2025	untold-festival-2025	The biggest electronic music festival in Romania	Cluj Arena	Stadium Alley 2	Cluj-Napoca	46.76863450	23.57170210	2025-08-07	16:00:00	06:00:00	https://placehold.co/600x400/purple/white?text=Untold+2025	500.00	2000.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.653364+02	2025-03-24 19:19:50.653364+02	3	4
5	Ed Sheeran Concert	ed-sheeran-concert	Ed Sheeran - Mathematics Tour	Cluj Arena	Stadium Alley 2	Cluj-Napoca	46.76863450	23.57170210	2025-09-05	19:30:00	23:00:00	https://placehold.co/600x400/purple/white?text=Ed+Sheeran	300.00	1100.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.647518+02	2025-03-24 19:19:50.647518+02	2	2
9	Romania vs. Germany - World Cup Qualifiers	romania-vs-germany	Qualification match for the 2026 World Cup	National Arena	Pierre de Coubertin Boulevard 3-5	Bucharest	44.44134320	26.15116380	2025-03-25	21:00:00	23:00:00	https://placehold.co/600x400/blue/white?text=Romania+vs+Germany	120.00	500.00	\N	2	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.656741+02	2025-03-24 19:19:50.656741+02	6	0
11	Hamlet - National Theater	hamlet-national-theater	A new interpretation of Shakespeare's masterpiece	National Theater Bucharest	Nicolae Balcescu Blvd. 2	Bucharest	44.43648980	26.10318300	2025-04-10	19:00:00	22:00:00	https://placehold.co/600x400/orange/white?text=Hamlet	100.00	250.00	\N	3	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:27:41.078475+02	2025-03-24 19:27:41.078475+02	10	0
13	Green Day Live	green-day-live	Green Day - Revolution Radio Tour	Sala Polivalenta	Strada Garii 4	Cluj-Napoca	46.78727570	23.59495970	2025-09-15	20:00:00	23:30:00	https://placehold.co/600x400/green/white?text=Green+Day	280.00	1100.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 15:59:33.651143+02	2025-03-26 15:59:33.651143+02	1	0
15	Rammstein Spectacular	rammstein-spectacular	Rammstein - Deutschland Tour	Stadionul Municipal	Strada Bucegi 10	Brasov	45.66068620	25.54319680	2025-11-05	21:00:00	01:00:00	https://placehold.co/600x400/black/white?text=Rammstein	300.00	1200.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	1	0
17	Coldplay Live	coldplay-live	Coldplay - Music of the Spheres World Tour	Sala Polivalenta	Strada Uzinei Electrice 2	Iasi	47.15845490	27.60144180	2025-10-10	19:30:00	22:30:00	https://placehold.co/600x400/blue/white?text=Coldplay	300.00	1100.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	2	0
19	Calvin Harris Electro Night	calvin-harris-electro	Calvin Harris - Massive Electronic Experience	Sala Polivalenta	Strada Garei 4	Cluj-Napoca	46.76718060	23.57026810	2025-07-25	22:00:00	04:00:00	https://placehold.co/600x400/blue/white?text=Calvin+Harris	250.00	900.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	3	0
20	Alesso DJ Set	alesso-dj-set	Alesso - Progressive House Experience	Stadionul Municipal	Strada Bucegi 10	Brasov	45.66068620	25.54319680	2025-08-15	23:00:00	05:00:00	https://placehold.co/600x400/cyan/black?text=Alesso	220.00	800.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	3	0
21	Zedd Electronic Concert	zedd-electronic	Zedd - Clarity World Tour	Arena Nationala	Strada Maior Gheorghe Sontu 29	Bucharest	44.46660380	26.08220400	2025-09-10	21:30:00	03:30:00	https://placehold.co/600x400/green/white?text=Zedd	270.00	950.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	3	0
25	Vienna Philharmonic	vienna-philharmonic	World-Renowned Vienna Philharmonic Orchestra	Romanian Athenaeum	Strada Benjamin Franklin 1-3	Bucharest	44.44117900	26.09749300	2025-11-20	19:00:00	21:30:00	https://placehold.co/600x400/gold/black?text=Vienna+Philharmonic	150.00	500.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	5	0
12	Romeo and Juliet - Bulandra Theater	romeo-juliet-bulandra-theater	A timeless love story	Bulandra Theater	Jean Louis Calderon St. 76	Bucharest	44.44359950	26.10454890	2025-05-20	19:00:00	21:30:00	https://placehold.co/600x400/orange/white?text=Romeo+and+Juliet	90.00	200.00	\N	3	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:27:41.078475+02	2025-03-24 19:27:41.078475+02	10	10
23	Post Malone Live	post-malone-live	Post Malone - Runaway Tour	Arena Banatul	Calea Aradului 21	Timisoara	45.76714020	21.22475630	2025-11-20	19:30:00	22:30:00	https://placehold.co/600x400/orange/white?text=Post+Malone	280.00	1000.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	4	2
16	Justin Bieber Tour	justin-bieber-tour	Justin Bieber - Justice World Tour	Arena Nationala	Strada Maior Gheorghe Sontu 29	Bucharest	44.46660380	26.08220400	2025-09-25	20:00:00	23:30:00	https://placehold.co/600x400/pink/white?text=Justin+Bieber	350.00	1300.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	2	2
18	The Weeknd Concert	the-weeknd-concert	The Weeknd - After Hours Tour	Arena Banatul	Calea Aradului 21	Timisoara	45.76714020	21.22475630	2025-11-15	20:30:00	23:45:00	https://placehold.co/600x400/purple/white?text=The+Weeknd	280.00	1000.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	2	2
27	Linkin Park Reunion	linkin-park-reunion	Linkin Park Reunion Concert	Arena Nationala	Strada Reuniunii 8	Bucharest	44.43728390	26.15254000	2026-01-10	20:00:00	23:00:00	https://placehold.co/600x400/black/white?text=Linkin+Park	310.00	1150.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	1	0
3	Iron Maiden Concert	iron-maiden-concert	Iron Maiden in concert - Legacy of the Beast Tour	Romexpo	Marasti Boulevard 65-67	Bucharest	44.47618240	26.06508930	2025-08-20	18:30:00	22:30:00	https://placehold.co/600x400/purple/white?text=Iron+Maiden	280.00	950.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.635973+02	2025-03-24 19:19:50.635973+02	1	2
29	Sia Live	sia-live	Sia - This Is Acting Tour	Sala Polivalenta	Strada Sia 7	Iasi	47.15384710	27.58717430	2026-03-10	20:30:00	23:30:00	https://placehold.co/600x400/pink/white?text=Sia	270.00	980.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	3	2
10	Romanian Cup Final	romanian-cup-final	Romanian Cup Final 2025	National Arena	Pierre de Coubertin Boulevard 3-5	Bucharest	44.44134320	26.15116380	2025-05-15	20:00:00	22:00:00	https://placehold.co/600x400/blue/white?text=Cup+Final	80.00	300.00	\N	2	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.656741+02	2025-03-24 19:19:50.656741+02	6	6
32	Adele Live	adele-live	Adele - Hello Tour	Opera House	Strada Muzicii 4	Cluj-Napoca	46.74766110	23.58240140	2026-06-10	20:00:00	23:00:00	https://placehold.co/600x400/purple/white?text=Adele	340.00	1250.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	2	12
4	Dua Lipa Concert	dua-lipa-concert	Dua Lipa - Future Nostalgia Tour	National Arena	Pierre de Coubertin Boulevard 3-5	Bucharest	44.44134320	26.15116380	2025-05-25	20:00:00	23:00:00	https://placehold.co/600x400/purple/white?text=Dua+Lipa	280.00	950.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.647518+02	2025-03-24 19:19:50.647518+02	2	81
24	J. Cole Homecoming	j-cole-homecoming	J. Cole - The Off-Season Tour	Stadionul Municipal	Strada Bucegi 10	Brasov	45.66068620	25.54319680	2025-12-10	20:30:00	23:45:00	https://placehold.co/600x400/red/white?text=J.+Cole	250.00	950.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	4	2
30	Kendrick Lamar Performance	kendrick-lamar-performance	Kendrick Lamar - DAMN. Tour	Arena Banatul	Calea Inspiratiei 12	Timisoara	45.75575590	21.23222080	2026-04-15	19:30:00	22:30:00	https://placehold.co/600x400/blue/white?text=Kendrick+Lamar	330.00	1200.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-03-26 16:36:40.607385+02	4	6
1	Metallica Concert	metallica-concert	Metallica returns to Romania with an amazing concert!	National Arena	Pierre de Coubertin Boulevard 3-5	Bucharest	44.44134320	26.15116380	2025-07-15	19:00:00	23:00:00	https://placehold.co/600x400/purple/white?text=Metallica	350.00	1200.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-24 19:19:50.635973+02	2025-03-24 19:19:50.635973+02	1	15
31	Ed Sheeran Acoustic	ed-sheeran-acoustic	Ed Sheeran - Divide Acoustic	Stadionul Central	Strada Melodiei 123	Bucharest	44.47746930	26.16280040	2026-05-18	18:30:00	21:00:00	https://placehold.co/600x400/red/white?text=Ed+Sheeran	265.00	955.00	\N	1	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-03-26 16:36:40.607385+02	2025-04-11 10:05:09.992349+03	5	25
34	Today Jazz Fusion	today-jazz-fusion	An immersive jazz experience available today.	Jazz Hall	456 Jazz Avenue	Cluj-Napoca	\N	\N	2025-04-14	20:00:00	23:00:00	https://placehold.co/600x400/blue/white?text=Jazz+Fusion	120.00	250.00	\N	3	Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.	f	active	2025-04-14 10:53:21.126736+03	2025-04-14 10:53:21.126736+03	7	6
\.


--
-- Data for Name: payment_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_tickets (payment_id, ticket_id) FROM stdin;
4	2
5	3
6	4
8	8
8	9
8	10
9	11
9	12
10	13
11	14
11	15
11	16
11	17
12	18
12	19
12	20
13	21
13	22
14	23
14	24
15	25
16	26
17	27
17	28
18	29
18	30
18	31
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, user_id, amount, currency, payment_method, transaction_id, status, refund_amount, created_at, updated_at) FROM stdin;
4	2	280.00	USD	card	tx_1743691796315_36a825de	succeeded	\N	2025-04-03 17:49:56.315402+03	2025-04-03 17:49:56.315402+03
5	2	1200.00	USD	card	tx_1743692557947_f9371ed1	succeeded	\N	2025-04-03 18:02:37.94781+03	2025-04-03 18:02:37.94781+03
6	2	750.00	USD	card	tx_1743692953041_db186f4c	succeeded	\N	2025-04-03 18:09:13.042123+03	2025-04-03 18:09:13.042123+03
8	2	6000.00	USD	card	tx_1743773125466_2f76bdeb	succeeded	\N	2025-04-04 16:25:25.467148+03	2025-04-04 16:25:25.467148+03
9	2	300.00	USD	card	tx_1743777524305_107250fb	succeeded	\N	2025-04-04 17:38:44.306043+03	2025-04-04 17:38:44.306043+03
10	6	950.00	USD	card	tx_1744283017273_bdbb5a44	succeeded	\N	2025-04-10 14:03:37.274108+03	2025-04-10 14:03:37.274108+03
11	2	1200.00	USD	card	tx_1744283281852_02aa6441	succeeded	\N	2025-04-10 14:08:01.85293+03	2025-04-10 14:08:01.85293+03
12	2	440.00	USD	card	tx_1744283567590_9bd6f70c	succeeded	\N	2025-04-10 14:12:47.590955+03	2025-04-10 14:12:47.590955+03
13	2	1800.00	USD	card	tx_1744286333227_fc4acca9	succeeded	\N	2025-04-10 14:58:53.227553+03	2025-04-10 14:58:53.227553+03
14	2	1100.00	USD	card	tx_1744288102340_a9b032f6	succeeded	\N	2025-04-10 15:28:22.339831+03	2025-04-10 15:28:22.339831+03
15	2	1200.00	USD	card	tx_1744375007066_3b492502	succeeded	\N	2025-04-11 15:36:47.066067+03	2025-04-11 15:36:47.066067+03
16	2	100.00	USD	card	tx_1744617329739_540fd878	succeeded	\N	2025-04-14 10:55:29.739593+03	2025-04-14 10:55:29.739593+03
17	2	200.00	USD	card	tx_1744618688571_ddec7d58	succeeded	\N	2025-04-14 11:18:08.571567+03	2025-04-14 11:18:08.571567+03
18	2	300.00	USD	card	tx_1744619112922_7977102c	succeeded	\N	2025-04-14 11:25:12.922298+03	2025-04-14 11:25:12.922298+03
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, user_id, event_id, rating, comment, created_at) FROM stdin;
1	2	4	5	Awesome event11	2025-04-03 16:23:01.075413+03
\.


--
-- Data for Name: social_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_accounts (id, user_id, provider, provider_id, provider_data, created_at) FROM stdin;
1	2	facebook	2608367206028658	{"id": "2608367206028658", "_raw": "{\\"id\\":\\"2608367206028658\\",\\"email\\":\\"ghitavalentin70\\\\u0040yahoo.com\\",\\"last_name\\":\\"Gabriel\\",\\"first_name\\":\\"Valentin\\"}", "name": {"givenName": "Valentin", "familyName": "Gabriel"}, "_json": {"id": "2608367206028658", "email": "ghitavalentin70@yahoo.com", "last_name": "Gabriel", "first_name": "Valentin"}, "emails": [{"value": "ghitavalentin70@yahoo.com"}], "provider": "facebook"}	2025-03-08 11:40:52.497095+02
2	6	google	110839357622165712743	{"id": "110839357622165712743", "_raw": "{\\n  \\"sub\\": \\"110839357622165712743\\",\\n  \\"name\\": \\"Valy\\",\\n  \\"given_name\\": \\"Valy\\",\\n  \\"picture\\": \\"https://lh3.googleusercontent.com/a/ACg8ocIPg1im-HH5H3GAuuX0zcjrjQFPfSzG7ppSARm7N2AjXJm_vRM\\\\u003ds96-c\\",\\n  \\"email\\": \\"braconieruvalica99@gmail.com\\",\\n  \\"email_verified\\": true\\n}", "name": {"givenName": "Valy"}, "_json": {"sub": "110839357622165712743", "name": "Valy", "email": "braconieruvalica99@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIPg1im-HH5H3GAuuX0zcjrjQFPfSzG7ppSARm7N2AjXJm_vRM=s96-c", "given_name": "Valy", "email_verified": true}, "emails": [{"value": "braconieruvalica99@gmail.com", "verified": true}], "photos": [{"value": "https://lh3.googleusercontent.com/a/ACg8ocIPg1im-HH5H3GAuuX0zcjrjQFPfSzG7ppSARm7N2AjXJm_vRM=s96-c"}], "provider": "google", "displayName": "Valy"}	2025-03-13 15:43:07.191093+02
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subcategories (id, category_id, name, slug, description, active, created_at, updated_at) FROM stdin;
1	1	Rock	rock	Rock and metal concerts	t	2025-03-24 19:18:56.27092+02	2025-03-24 19:18:56.27092+02
2	1	Pop	pop	Pop music concerts	t	2025-03-24 19:18:56.27092+02	2025-03-24 19:18:56.27092+02
3	1	Electronic	electronic	Electronic music and DJs	t	2025-03-24 19:18:56.27092+02	2025-03-24 19:18:56.27092+02
4	1	Hip Hop	hip-hop	Hip hop and rap concerts	t	2025-03-24 19:18:56.27092+02	2025-03-24 19:18:56.27092+02
5	1	Classical	classical	Classical music concerts	t	2025-03-24 19:18:56.27092+02	2025-03-24 19:18:56.27092+02
6	2	Football	football	Football matches and competitions	t	2025-03-24 19:18:56.27729+02	2025-03-24 19:18:56.27729+02
7	2	Basketball	basketball	Basketball games and competitions	t	2025-03-24 19:18:56.27729+02	2025-03-24 19:18:56.27729+02
8	2	Tennis	tennis	Tennis tournaments and matches	t	2025-03-24 19:18:56.27729+02	2025-03-24 19:18:56.27729+02
9	2	Extreme Sports	extreme-sports	Extreme sports competitions	t	2025-03-24 19:18:56.27729+02	2025-03-24 19:18:56.27729+02
10	3	Drama	drama	Dramatic theater performances	t	2025-03-24 19:18:56.281404+02	2025-03-24 19:18:56.281404+02
11	3	Comedy	comedy	Stand-up comedy and humorous shows	t	2025-03-24 19:18:56.281404+02	2025-03-24 19:18:56.281404+02
12	3	Musical	musical	Musical theater performances	t	2025-03-24 19:18:56.281404+02	2025-03-24 19:18:56.281404+02
13	3	Opera	opera	Opera performances	t	2025-03-24 19:18:56.281404+02	2025-03-24 19:18:56.281404+02
14	4	Music	music	Music festivals	t	2025-03-24 19:18:56.617597+02	2025-03-24 19:18:56.617597+02
15	4	Film	film	Film festivals	t	2025-03-24 19:18:56.617597+02	2025-03-24 19:18:56.617597+02
16	4	Arts & Culture	arts-culture	Cultural and artistic festivals	t	2025-03-24 19:18:56.617597+02	2025-03-24 19:18:56.617597+02
17	4	Food	food	Culinary festivals	t	2025-03-24 19:18:56.617597+02	2025-03-24 19:18:56.617597+02
\.


--
-- Data for Name: ticket_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_types (id, event_id, name, description, price, quantity, available_quantity, created_at, updated_at) FROM stdin;
1	1	General Admission	Standard entry ticket	350.00	1000	1000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
3	1	Golden Circle	Front row standing area	750.00	300	300	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
6	2	Backstage Pass	Standard ticket with backstage tour	1000.00	50	50	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
7	3	General Entry	Standard access ticket	280.00	1500	1500	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
9	3	Ultimate Fan Experience	Meet the band and front row seats	950.00	100	100	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
11	4	Dance Zone	Standing area near the stage	450.00	500	500	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
13	5	General Admission	Standard entry ticket	300.00	1500	1500	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
14	5	Premium Ticket	Better seats with good visibility	600.00	800	800	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
15	5	Ultimate Package	Best seats with exclusive merchandise	1100.00	200	200	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
16	6	Standard Entry	Regular seating	400.00	1500	1500	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
18	6	VIP Experience	Meet & greet with premium seats	1500.00	100	100	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
19	7	Regular Pass	4-day festival access	500.00	5000	5000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
20	7	VIP Pass	Access to VIP areas and special activities	1200.00	1000	1000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
22	8	Standard Ticket	Regular entry	250.00	1000	1000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
23	8	VIP Access	VIP area access	800.00	200	200	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
24	9	General Seat	Regular seating	120.00	20000	20000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
25	9	Premium Seat	Better visibility seats	300.00	5000	5000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
26	9	VIP Box	Private box with catering	500.00	1000	1000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
27	10	Regular Ticket	Standard seating	80.00	15000	15000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
28	10	Premium Ticket	Better seats	200.00	4000	4000	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
30	11	Standard Seat	Regular theater seating	100.00	400	400	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
31	11	Premium Seat	Premium visibility seats	180.00	100	100	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
32	11	VIP Experience	Best seats with program	250.00	50	50	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
8	3	Beast Package	Premium access with exclusive merchandise	750.00	300	299	2025-04-03 16:28:24.134333+03	2025-04-03 16:28:24.134333+03
10	4	Standard Ticket	Regular seating	280.00	1000	1000	2025-04-03 16:28:24.134333+03	2025-04-04 16:05:19.350159+03
12	4	VIP Experience	Premium seats and backstage tour	950.00	100	99	2025-04-03 16:28:24.134333+03	2025-04-10 14:03:37.345196+03
29	10	VIP Experience	VIP access and refreshments	300.00	1000	997	2025-04-03 16:28:24.134333+03	2025-04-10 14:09:30.632688+03
34	12	Premium Ticket	Premium seats	150.00	100	97	2025-04-03 16:28:24.134333+03	2025-04-10 14:12:47.63203+03
35	12	VIP Package	Best seats with exclusive experience	200.00	50	49	2025-04-03 16:28:24.134333+03	2025-04-10 14:12:47.645573+03
33	12	Regular Ticket	Standard theater seating	90.00	350	350	2025-04-03 16:28:24.134333+03	2025-04-10 14:13:09.098324+03
5	2	Premium Package	Premium seats with merchandise	800.00	200	199	2025-04-03 16:28:24.134333+03	2025-04-10 15:28:22.435309+03
4	2	Standard Ticket	Regular seating	300.00	1200	1200	2025-04-03 16:28:24.134333+03	2025-04-10 15:28:28.851484+03
21	7	Ultimate Experience	All access pass with accommodation	2000.00	200	200	2025-04-03 16:28:24.134333+03	2025-04-10 15:28:34.507555+03
17	6	Swiftie Package	Premium seats with tour merchandise	900.00	500	500	2025-04-03 16:28:24.134333+03	2025-04-10 15:57:05.327483+03
2	1	VIP Package	VIP access with exclusive area and meet & greet	1200.00	100	98	2025-04-03 16:28:24.134333+03	2025-04-11 15:36:47.113865+03
36	34	General Admission Ticket	Standard entry ticket	100.00	100	94	2025-04-14 10:54:32.628284+03	2025-04-14 11:25:12.940986+03
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_type_id, user_id, event_id, qr_code, price, status, purchase_date, reservation_expires_at, created_at, updated_at, checked_in, checked_in_at, refund_status, cancelled_at) FROM stdin;
11	34	2	12	data:image/png;base64,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	150.00	purchased	2025-04-04 17:38:44.306043+03	\N	2025-04-04 17:38:44.306043+03	2025-04-04 17:38:44.306043+03	f	\N	\N	\N
12	34	2	12	data:image/png;base64,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	150.00	purchased	2025-04-04 17:38:44.306043+03	\N	2025-04-04 17:38:44.306043+03	2025-04-04 17:38:44.306043+03	f	\N	\N	\N
3	2	2	1	data:image/png;base64,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	1200.00	cancelled	2025-04-03 18:02:37.94781+03	\N	2025-04-03 18:02:37.94781+03	2025-04-04 18:09:43.5616+03	f	\N	denied	2025-04-04 15:56:05.561305+03
2	10	2	4	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEECAYAAADOCEoKAAAAAklEQVR4AewaftIAAA+3SURBVO3BQY7c2JIAQXei7n9lHy24iNXDEMwsqT/CzP5grbX+uFhrrdvFWmvdLtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuP7yk8psqJpWTim9SeaNiUpkqJpWp4kTlN1U8ofJGxaRyUjGpvFFxovKbKt64WGut28Vaa90u1lrr9sOHVXySyknFicoTFZPKVHFScaIyqUwVk8pUcaIyVXySyjdVTCpTxRMVT1ScqLxR8Ukqn3Sx1lq3i7XWul2stdbthy9TeaLikyqeUJkqJpWp4kRlqphUJpWp4pNUpopJ5aTiCZWTiknlCZUnVKaKSeU3qTxR8U0Xa611u1hrrdvFWmvdfviPU3mi4pNUTiqeqHhCZao4qZhUpooTlTcqTiomlZOKSeWk4omKSeV/2cVaa90u1lrrdrHWWrcf/sdVnKg8UXGi8kkqT6i8ofJExaTym1Smikll/f9drLXW7WKttW4Xa611++HLKn5TxaQyVTyhclIxVUwqT6icVDyhMlU8oTJVnFRMKicqU8VUMalMFZPKVHGiMlVMKlPFJ1X8Sy7WWut2sdZat4u11rr98GEq/2UVk8pUMalMFScVk8pUMamcqEwVT6hMFU+oTBWfpDJVTCpTxaQyVXySylRxovIvu1hrrdvFWmvdLtZa6/bDSxX/EpWpYlJ5ouKbKiaVqWJSmSreqHijYlL5pIpJZao4qTipmFSmijcq/ksu1lrrdrHWWreLtda6/fCSylTxhMpUMak8UXFS8YbKVDGpPKFyovJJKr+p4g2VqeIJlW+qmFQ+qeJEZap442KttW4Xa611u1hrrdsPH6byRMWkMlU8oTJVnKhMFZPKGxVPVDyhclIxqUwVk8qJylQxVZyovKEyVUwqU8Wk8obKVDFVTCpTxaTyhMpU8UkXa611u1hrrdvFWmvdfnipYlKZKiaVJ1SmipOKSeWk4omKSWWqeEPliYonKiaVqWJSmSqeUJkqJpUnKiaVJypOVJ5QmSqmikllqphUTiq+6WKttW4Xa611u1hrrdsPL6mcqEwVT1RMKlPFpHJSMalMFScqT6g8UTGpPKEyVUwqT1R8kspUcVIxqUwVk8oTKicqU8WJylTxX3Kx1lq3i7XWul2stdbN/uAFlZOKJ1Q+qeIJlZOKv0nlmyomlW+qOFE5qfgmlZOKSeWJin/JxVpr3S7WWut2sdZaN/uDF1TeqHhDZao4UZkqTlSmikllqphU3qg4UXmiYlL5pIpPUpkqJpWTikllqnhC5ZMq/iUXa611u1hrrdvFWmvd7A8+SOWk4gmVNyqeUDmpmFROKiaVqWJSOak4UZkqnlA5qfgklanik1Smit+kMlVMKicVk8pU8UkXa611u1hrrdvFWmvdfnhJ5aRiUpkqJpWpYlI5qZhUnqh4omJSeaPiRGWqmCqeUHlDZaqYVE4qJpWpYlJ5ouJEZaqYVE4qTiomlaliUplUpopJZap442KttW4Xa611u1hrrdsPL1W8oTJVTCpPqDxRcaJyUjFVTCqfVDGpTBWTyknFicobFZPKpPJJFZPKGxW/qeKJik+6WGut28Vaa90u1lrr9sOXqUwVk8pJxYnKVDGpnKhMFScVk8pUcVJxojJVTCpTxRMVJyonKicqU8VUMalMFScVk8obFZPKVHGiMlVMKm+oPFHxxsVaa90u1lrrdrHWWrcfXlKZKp6oOFF5QmWq+CSVN1ROKiaVE5Wp4gmVk4pJ5aTiROUNlROVqeKTVKaKJyomlX/JxVpr3S7WWut2sdZaN/uD/yEqn1QxqUwVk8pJxYnKVDGpnFScqDxRMam8UXGi8kbFEyonFU+oPFFxojJVfNPFWmvdLtZa63ax1lq3H15SeaJiUpkqJpVPqjhRmVSeqJhUnqiYVKaKSeWNikllUnmj4o2KSeWbKp5QOamYVE5UTlSmik+6WGut28Vaa90u1lrrZn/wRSpPVJyoPFExqXxTxaQyVUwqU8WJylTxTSq/qeIJlTcqJpU3KiaVk4onVKaKT7pYa63bxVpr3S7WWutmf/BBKlPFpPJJFZ+k8kkVk8oTFZPKN1W8oTJV/CaVk4oTlScqJpUnKk5Unqh442KttW4Xa611u1hrrdsPL6m8UTGpTBWTyonKGxUnKm9UTCpvVEwqU8Wk8obKVPGEyknFpPJGxaQyVUwVk8pU8UbFicpUcaLySRdrrXW7WGut28Vaa91++MtUpopJZap4o2JSeaJiUnmjYlL5TRVvqEwVk8pUMalMKm9UTCpTxaRyUvFGxaQyVUwVJypTxSddrLXW7WKttW4Xa611sz94QeWNiidUpoonVKaKE5WTihOVqeJE5ZMqnlA5qZhUnqg4UZkqTlSmiknlpOJEZaqYVKaKSWWqeELlpOKTLtZa63ax1lq3i7XWuv3wUsUbKm+onFRMFZPKVDFVTCpvqLxR8YTKN1VMKlPFpPKGyhMVv0nlROWNim+6WGut28Vaa90u1lrr9sOHqUwVk8pJxRMqT6hMFZPKScWJylQxqfxNFU+oTCpTxVTxSSpTxYnKScU3VTyhMlU8oTJVvHGx1lq3i7XWul2stdbth5dUpopPUpkqTiomlaliUpkqJpVJ5aRiUjmpOFGZVKaKSeUJlanik1SmikllqphUnqiYVCaVk4qpYlJ5QmWqeEPlmy7WWut2sdZat4u11rr98GEqU8VUMamcVDyhMlVMKk9UPKHyhMpUcVIxqUwVk8pJxRsqT6hMFU+o/E0Vk8pJxRsqJxWfdLHWWreLtda6Xay11s3+4AWVk4oTlU+qmFSeqHhC5YmKSeWNihOVb6qYVN6omFSmihOVqeJE5aRiUvmbKr7pYq21bhdrrXW7WGutm/3BF6lMFW+oTBWTyknFicoTFU+oTBWTylQxqUwVT6i8UXGiMlV8ksobFScqU8UTKicVk8pU8YTKVPHGxVpr3S7WWut2sdZaN/uDF1SmihOVk4pJ5aTim1SeqHhC5YmKSeWk4kRlqphU3qg4UZkqJpWTim9SeaJiUpkq3lA5qXjjYq21bhdrrXW7WGut2w8fpjJVTBWTyknFEypTxaTyRMUbKicVT6hMFScqJxW/SeWNiidUnqiYKp5QOVE5qfibLtZa63ax1lq3i7XWuv3wl1VMKk9UnKhMFZPKVHGiMlWcVEwqJypPqDxRMalMFVPFEypPVEwqT6icVJyoPKEyVZxUTConKlPFVPFNF2utdbtYa63bxVpr3X74sIpJ5aTipOJE5TdVTCpTxRMqU8WkMlVMKicVT6icVJxUTCpTxUnFpPJExaQyVTyhMlVMKicqT1RMKlPFN12stdbtYq21bhdrrXX74csqJpWTiknljYpJ5TepTBWTyqQyVUwqJxUnKlPFGyonFZPKExUnFZPKicqJylTxSRWTyqQyVUwqJxVvXKy11u1irbVuF2utdfvhy1ROVKaKqeIJlUnlpGJSOak4UZkqnqh4ouJEZap4QuWTKiaVqeJE5aRiUjmpeKNiUjlRmSreqPiki7XWul2stdbtYq21bj/841SmiknlpOJE5aRiUpkqJpXfpDJVPKFyUvGEyhMVJypTxaQyqZxUTConFZPKVDFVnKicqDyhMlW8cbHWWreLtda6Xay11u2HD1OZKp5QmSqeqJhUpoqpYlI5qZhUTlROKt6oOKmYVN5QOak4UZkqTiqeqPgklaliUjmpmComlaliUpkqJpVPulhrrdvFWmvdLtZa6/bDSxUnKk9UTCpTxRsqU8WJyhMVn6RyojJVTCpTxaRyovKEyknFEypTxVQxqbxRMamcVEwqn1Txmy7WWut2sdZat4u11rr98JLKExUnKlPFpPJExYnKVDGpnFScqDxR8UTFpHKiMlWcqEwVb6i8oTJVfJLKEypTxYnKVHGi8psu1lrrdrHWWreLtda6/fBhFW9UTCpTxSdVTConFScqU8WJyqTym1SmiqliUpkqJpWTiknlpGJSmVQ+qWJSeUJlqnhC5W+6WGut28Vaa90u1lrr9sNLFU+oTBUnFZPKVDGpTBUnKlPFJ6k8UTGpnKicVJyonKhMFScVk8onVUwqU8UTKicVT1RMKlPFpDJVPKHySRdrrXW7WGut28Vaa91+eEnlm1SmipOKJyomlW+qOFGZKj5J5URlqvibVD5J5ZMqPkllqvhNF2utdbtYa63bxVpr3ewPvkjljYoTlTcqTlT+popJ5ZMqnlCZKiaVk4oTlZOKN1SmiknlpOJE5YmKSeWJik+6WGut28Vaa90u1lrrZn/wgspUMalMFScqJxWTylTxhspUcaLyRsWkMlWcqHxSxaTyTRVPqEwVk8pUcaIyVZyoPFExqZxU/E0Xa611u1hrrdvFWmvdfvgwlROVk4oTlROVqeJEZao4UZkqJpWTiknlCZWp4gmVE5Wp4kTlk1Smiqnim1TeqDipmFT+JRdrrXW7WGut28Vaa93sD/5hKicVk8o3VTyhMlVMKlPFpHJScaLySRUnKlPFpHJSMak8UTGpPFExqUwVk8o3VZyoTBVvXKy11u1irbVuF2utdbM/+A9TeaPiDZWpYlJ5ouIJlScqnlA5qXhD5YmKSWWqeEJlqnhCZap4QuWNik+6WGut28Vaa90u1lrr9sNLKr+p4omKE5WTikllqphUnqiYVE4qTiomlROVqeKkYlKZKiaVk4oTlUnlROWkYqr4JpWp4qTib7pYa63bxVpr3S7WWuv2w4dVfJLKScWJyhsqT1RMKicqU8WkMqlMFZPKExVPqEwVk8o3VTyh8obKGxWfpHJS8cbFWmvdLtZa63ax1lq3H75M5YmKJ1SmipOKb1I5qThRmSomlUllqphUJpU3KiaVqWJSeUJlqphUpoqTijcqJpUTlTdUpoqpYlL5pIu11rpdrLXW7WKttW4//MdV/E0qT6g8oTJVTCqTylRxovJNFZ9UMamcVEwqJxUnFZPKVDGpTBVPqPymi7XWul2stdbtYq21bj/8j1GZKj5J5ZsqJpWTihOVb6p4Q2WqeKJiUnlDZao4qTipOFF5ouKbLtZa63ax1lq3i7XWuv3wZRV/k8pUMal8U8WkMlVMKicqU8VJxYnKScWJyhsVJypTxaRyovKGyknFpDJVTConFZPKb7pYa63bxVpr3S7WWutmf/CCym+qmFROKiaVqeJEZao4UZkqTlQ+qeINlaliUnmiYlJ5o2JSOamYVE4qJpVPqvgklanijYu11rpdrLXW7WKttW72B2ut9cfFWmvdLtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuF2utdfs/M7DLnhxnPewAAAAASUVORK5CYII=	280.00	cancelled	2025-04-03 17:49:56.315402+03	\N	2025-04-03 17:49:56.315402+03	2025-04-04 18:11:52.663676+03	f	\N	completed	2025-04-04 16:05:19.348235+03
4	8	2	3	data:image/png;base64,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	750.00	cancelled	2025-04-03 18:09:13.042123+03	\N	2025-04-03 18:09:13.042123+03	2025-04-10 14:02:32.877832+03	f	\N	completed	2025-04-04 16:00:23.988801+03
13	12	6	4	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEECAYAAADOCEoKAAAAAklEQVR4AewaftIAAA+xSURBVO3BQW7k2rIgQXdC+9+ytwYcxOgABDN16/0OM/vFWmv9ulhrrdvFWmvdLtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuP7yk8pcqJpUnKk5Upoo3VJ6oOFGZKiaVqeJEZaqYVKaKE5Wp4kTlv1QxqTxRcaLylyreuFhrrdvFWmvdLtZa6/bDh1V8ksoTFU+oTBUnKk9UTConKlPFicpU8UTFEyonFScqU8WJyhMVk8qJyknFpPJGxSepfNLFWmvdLtZa63ax1lq3H75M5YmKJypOVE4qJpU3Kt6oeKLiL1W8UfFExYnKScUbKt+k8kTFN12stdbtYq21bhdrrXX74X+cyknFJ1VMKpPKVPGGyl9SeUPljYpJZap4QmWqeKJiUvm/7GKttW4Xa611u1hrrdsP/+MqnlCZKqaKE5WTikllqnij4gmVT1L5JpWp4qRiUpkqTlROKv5/crHWWreLtda6Xay11u2HL6v4L6mcqEwVk8pUMalMKicqJxVPqEwVJxVPqJxU/CWVqeJEZaqYKk5UpopPqviXXKy11u1irbVuF2utdfvhw1T+kspUcVIxqXxSxaQyVUwq/yWVqeKkYlKZKiaVqWJSmSomlaliUpkqJpUTlaniCZWp4kTlX3ax1lq3i7XWul2stdbth5cq/mUVk8oTFScVk8pUMamcqEwVk8pU8UbFJ6mcqHyTylQxqUwVT6g8UfG/5GKttW4Xa611u1hrrZv94gWVqWJSOamYVJ6omFROKiaVk4oTlanik1SeqJhUPqniDZWp4g2VqeIJlTcqTlSmihOVqWJSOal442KttW4Xa611u1hrrdsPX1YxqUwqU8UTKicVk8pUMam8oTJVnKhMFVPFicqkMlU8ofJJKicqJxUnFZPKVPFExRsqU8Wk8kbFpPJJF2utdbtYa63bxVpr3X54qWJSeaJiUjmpOKk4qTipeKLiCZUTlTcqJpWTiqliUnmj4kRlqjhRmSq+SeWkYqqYVKaKSeVfcrHWWreLtda6Xay11s1+8UUqU8UbKicVk8pUMak8UTGpnFScqEwVn6TyRsWkMlWcqJxUTCpTxRsqT1RMKm9UfJLKVPFJF2utdbtYa63bxVpr3X74MJWpYlKZKk5UnlCZKiaVk4oTlaniROUNlaliUpkqnqg4UZkq3qiYVL6pYlI5UXmi4r+kMlW8cbHWWreLtda6Xay11s1+8YLKJ1WcqEwVk8pJxaQyVbyh8kTFGyonFZPKVPGGylTxhspJxaRyUnGiMlV8kspJxaTyRMUnXay11u1irbVuF2utdfvhwyomlSdUTiqeqJhUpoonVE4qnlA5qXhDZaqYVKaKSeWkYlKZKt6omFSmiidUpopJZaqYVKaKk4pJZVKZKv5LF2utdbtYa63bxVpr3ewXH6QyVZyoTBXfpPJGxYnKScWJyhMVk8oTFZPKScWkMlW8oTJVnKhMFZPKVDGpTBVPqEwVJyonFU+oTBVvXKy11u1irbVuF2utdfvhwypOVJ5QOamYVD6p4kRlqphUJpUnKiaVSWWqmFTeqJhUPkllqnhDZar4JJUTlanipGJSeaLiky7WWut2sdZat4u11rr98JLKVHFS8UTFpHJS8UkqJxVPVJyofFLFicobFZPKScVUcaIyVZxUnKicqJxUfJLKVDGpTBXfdLHWWreLtda6Xay11s1+8UEqU8Wk8k0Vk8pJxaQyVbyhMlVMKk9UnKhMFZPKExWTyknFpPJExSepTBUnKicVk8pUMalMFW+onFS8cbHWWreLtda6Xay11s1+8R9SOan4SypTxaQyVZyoTBUnKm9UTCpTxRMqU8VfUjmp+JeoTBUnKlPFpDJVfNPFWmvdLtZa63ax1lq3H/6YylRxovJGxaTyRsWkclJxovJExRsqJxVvqJxUTCpTxVRxojJVTCpTxV9S+SSVqeKTLtZa63ax1lq3i7XWutkv/kMqU8UTKt9U8YTKJ1VMKlPFpPJJFZPKVHGi8kTFGyonFZPKN1V8k8pU8cbFWmvdLtZa63ax1lq3Hz5MZap4Q+WkYlI5qZhUpooTlZOKSeUNlROVk4pJ5Y2KNypOVE4qvqliUjmpmFSeUJkqJpWTik+6WGut28Vaa90u1lrrZr/4QypPVJyofFLFpPJExaRyUvFfUpkqTlSmiknlpGJS+aSKN1SmikllqjhRmSreUDmpeONirbVuF2utdbtYa62b/eIFlTcqTlROKt5QOak4UfmmikllqjhRmSreUHmjYlI5qThRmSomlZOKN1SmiknlpOINlanijYu11rpdrLXW7WKttW72iw9SeaLiDZWpYlL5popJZao4UTmp+EsqU8UTKm9UTCpTxaRyUvGGyidVnKhMFX/pYq21bhdrrXW7WGutm/3ii1T+UsUTKlPFpDJVPKFyUjGpTBWTylQxqXxTxaQyVUwqU8WkclLxhMpUMalMFZPKVDGpfFPFpHJS8UkXa611u1hrrdvFWmvd7BcfpDJVTConFU+oPFExqfylihOVqWJSOamYVKaKJ1SmihOVqeIJlZOKSWWq+EsqU8UTKk9UTCpTxRsXa611u1hrrdvFWmvdfnhJ5YmKSeVEZap4omJS+aSKJ1ROKiaVqWJSeUNlqjhRmSqeUJkq3qiYVE4qJpWp4pNUpop/2cVaa90u1lrrdrHWWrcfXqo4UXmj4g2VJyreUJkqpopJ5aTipOKNijdUpopJ5URlqjhRmSqeUJkqTlSmiicqnqg4Ufmmi7XWul2stdbtYq21bj98mMobKp9UMal8kspUMalMFU+oTBVvqLxR8UTFGypTxaQyVbyh8obKN1V808Vaa90u1lrrdrHWWrcfXlI5qfgklanijYoTlSdUpoonVKaKSWWqmFROKp5QOVE5qZhUpoo3Kk5UTiqmiknlpGJSmSomlaniX3Kx1lq3i7XWul2stdbthw+rmFSmihOVk4pJ5aTijYpJ5aTiROWk4pMq3qiYVKaKN1SmiqliUjmpOKmYVKaKqWJSmSqmipOKSWWqmFROKj7pYq21bhdrrXW7WGut2w9fVjGpnFQ8UXGicqIyVfylikllqpgqJpVvUpkqTlSmiqniRGWqOKmYVKaKJ1SmiqniL1X8pYu11rpdrLXW7WKttW72iw9SOal4QuWkYlKZKp5QOak4UZkqJpU3Kt5QmSreUHmiYlI5qZhUpopJZap4QuWJiknlpOJEZao4UZkq3rhYa63bxVpr3S7WWutmv/gglTcqnlCZKk5UTipOVKaKE5WpYlI5qXhC5Y2KSeWkYlI5qThROamYVP4lFZPKVDGpvFHxSRdrrXW7WGut28Vaa91+eEnlpOIJlScqJpWTiknlk1Smiknlk1SmihOVqeKkYlI5qThROamYVD6p4pNUnlB5ouIvXay11u1irbVuF2utdfvhpYpJ5URlqpgqnlCZKk5UTlROKiaVE5WpYlI5UZkqPknlpGKqmFROKk4qJpVPqvgklScqJpWpYlJ5QmWqeONirbVuF2utdbtYa62b/eIFlScqnlCZKt5QeaJiUjmpmFROKt5QOan4JJWp4g2Vk4o3VJ6o+F+iMlW8cbHWWreLtda6Xay11s1+8YLKJ1WcqLxRMalMFZPKGxWTyhsVT6hMFZPKVDGpPFExqUwVk8obFZPKScWkclIxqUwVk8pU8YTKScU3Xay11u1irbVuF2utdbNffJHKN1VMKlPFpDJVnKhMFScqT1RMKlPFEypPVLyh8kkVJyonFU+oTBUnKicVT6icVPyli7XWul2stdbtYq21bj/8Yyq+qeINlZOKSeVEZaqYVL5JZap4ouJE5aTiRGWqOFGZKiaVqWJSOal4QuWJihOVqeKTLtZa63ax1lq3i7XWuv3wksobFZPKScVJxaRyUnFScaLyRsVJxYnKScWkMlVMKk9UTCpTxaTyRMWJylTxhMpJxaQyVUwqU8Wk8kkqU8UbF2utdbtYa63bxVpr3ewXH6RyUjGpnFQ8oTJVTCpTxaQyVTyhclJxovJJFZPKN1VMKlPFpPJExb9EZao4UZkq/iUXa611u1hrrdvFWmvd7BcfpPKXKk5Upoo3VN6omFROKk5UpopJZap4Q2Wq+CSVqWJSmSpOVE4q3lCZKt5QOan4pou11rpdrLXW7WKttW4//LGKT1KZKk5UTiqeqDhROal4QuWJiidUPkllqjipeEJlqpgqTlROKk4q/ksqU8UbF2utdbtYa63bxVpr3X54SWWqmFSeUPmXqEwVb6g8UTFVTCqTylTxRsWJylRxojJVnKhMFScqU8VJxRMqb1ScVPyXLtZa63ax1lq3i7XWutkvXlD5pIonVKaKE5UnKk5U3qiYVE4qTlSmihOVk4onVKaKT1KZKiaVqWJSmSpOVE4qJpWpYlJ5omJSmSo+6WKttW4Xa611u1hrrZv94h+m8i+pOFGZKiaVJyqeUPmmiknlmypOVKaKSWWqOFE5qZhUvqliUpkqPulirbVuF2utdbtYa63bD/+4ihOVk4pJ5aTiRGWqOFGZKiaVE5Wp4qRiUpkqnlD5pooTlanik1SmijcqnlCZKk4qvulirbVuF2utdbtYa63bDy+p/KWKk4pJZao4UZkqnqg4UZkqnlCZKiaVJ1SmiicqTlSmihOVN1SmiknlRGWqmFSeUJkqTlSmikllqviki7XWul2stdbtYq21bj98WMUnqTyh8oTKJ6mcVJyoTBVTxaTyRsUTKlPFpDJVTConFZPKExWTylTxlyreUJkqvulirbVuF2utdbtYa62b/eIFlaliUnmiYlKZKp5QmSreUDmpeEJlqphUTiomlf8lFU+oTBV/SeWbKiaVJyreuFhrrdvFWmvdLtZa6/bD/ziVqWKqmFSmikllqpgqJpVJZao4qTipmFQmlScqvknlDZWTijdUpooTlaniDZWp4qRiUpkqPulirbVuF2utdbtYa63bD//HqEwVU8VJxRMVk8qJylQxqUwVU8UbKlPFicpU8UbFpDJVPKHyRMWJyonKScVJxRsV33Sx1lq3i7XWul2stdbthy+r+KaKSWVSmSomlZOK/5LKVDGpTBVvqEwVT1Q8UTGpPFExqZyoTBVTxYnKVDGpnFQ8oTJVTCpTxRsXa611u1hrrdvFWmvdfvgwlb+kMlVMKpPKVPGEyknFScWk8oTKVHGiMlVMKicqJxWTyhMVJxX/yyomlZOKJyo+6WKttW4Xa611u1hrrZv9Yq21fl2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuF2utdbtYa63bxVpr3S7WWut2sdZat/8HCBgu3cQ5DUgAAAAASUVORK5CYII=	950.00	purchased	2025-04-10 14:03:37.274108+03	\N	2025-04-10 14:03:37.274108+03	2025-04-10 14:03:37.274108+03	f	\N	\N	\N
15	29	2	10	data:image/png;base64,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	300.00	purchased	2025-04-10 14:08:01.85293+03	\N	2025-04-10 14:08:01.85293+03	2025-04-10 14:08:01.85293+03	f	\N	\N	\N
16	29	2	10	data:image/png;base64,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	300.00	purchased	2025-04-10 14:08:01.85293+03	\N	2025-04-10 14:08:01.85293+03	2025-04-10 14:08:01.85293+03	f	\N	\N	\N
17	29	2	10	data:image/png;base64,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	300.00	purchased	2025-04-10 14:08:01.85293+03	\N	2025-04-10 14:08:01.85293+03	2025-04-10 14:08:01.85293+03	f	\N	\N	\N
14	29	2	10	data:image/png;base64,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	300.00	cancelled	2025-04-10 14:08:01.85293+03	\N	2025-04-10 14:08:01.85293+03	2025-04-10 14:10:30.669515+03	f	\N	completed	2025-04-10 14:09:30.630764+03
9	21	2	7	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEECAYAAADOCEoKAAAAAklEQVR4AewaftIAABAWSURBVO3BQY7c2JIAQXei7n9lHy24iNUDCGaW1H/CzP5grbX+uFhrrdvFWmvdLtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuP7yk8psqJpWpYlKZKt5QOamYVN6omFSeqDhRmSomlZOKSWWqOFGZKk5UPqniROWk4kTlN1W8cbHWWreLtda6Xay11u2HD6v4JJUnVKaKJ1SmiidUpopJ5ZMqJpUnKp6omFSeUJkqnqh4QuVEZaqYKiaVNyo+SeWTLtZa63ax1lq3i7XWuv3wZSpPVDxRcaIyVXxSxaQyqZxUnKhMFZPKVHGiMlVMKlPFpDJVTCqTyhMqU8WJyknFEyq/SeWJim+6WGut28Vaa90u1lrr9sN/nMpUcaLyhMqJyhMVT1ScVHxSxaRyonJSMalMKlPFpDJVTBWTyqQyVZxUnKj8L7tYa63bxVpr3S7WWuv2w39cxaTyRMUbKicVT6g8UXGicqLyRMWJyqTyTSonFScqU8X/ZxdrrXW7WGut28Vaa91++LKKv6liUnlC5Q2Vk4qTik+qeELlROWJihOVJypOVKaKqWJSOan4pIp/ycVaa90u1lrrdrHWWrcfPkzlN6lMFZPKVDGpTBUnFZPKVDGpTBWTylQxqUwVk8pU8YTKVPFGxaRyojJVTConKlPFEypTxaRyojJVnKj8yy7WWut2sdZat4u11rr98FLFv0TliYonVKaKSWWqmFSmik9SeaLimyomlTdUpopJ5UTlDZWp4qTiv+RirbVuF2utdbtYa63bDy+pTBWTyknFpPJExaTyhspUMak8ofKEylTxSSqfVDGpPFFxUnGiMlWcqEwVk8pJxRMqU8WJylQxqZxUvHGx1lq3i7XWul2stdbth79M5aRiUvmmiidUfpPKExUnKlPFpHKiclIxqUwqJxWTylQxqUwVU8VJxYnKScWJylQxVUwqU8Wk8kkXa611u1hrrdvFWmvd7A9+kcpUMam8UXGiMlWcqJxUTCpTxSepnFScqEwVk8pJxYnKVHGiMlX8JpWpYlJ5ouIJlZOKE5Wp4o2Ltda6Xay11u1irbVuP7ykclLxRsWkMlU8UfFGxRMq31RxojJVTCpPqJxUTCpTxVTxTSqfVDGpTConFVPFEypTxSddrLXW7WKttW4Xa611sz/4IJWp4gmVJypOVL6p4kTlpGJSmSomlZOKJ1ROKiaVk4oTlaniRGWqeEPljYonVE4qJpWpYlI5qXjjYq21bhdrrXW7WGut2w9/mcpU8YTKScWkclIxqZyoTBVTxYnKGxUnKlPFv0RlqpgqTlSmipOKSWWqeENlqvimik+6WGut28Vaa90u1lrrZn/wgspUMal8UsWJym+qmFSmik9SmSqeUJkqnlCZKiaVqWJSeaJiUpkqJpWpYlJ5omJSmSomlaliUpkqTlSmim+6WGut28Vaa90u1lrr9sNLFU9UTConFd9UMalMFScqb6g8UTGpTBVPqDxRMalMFScVn6QyVUwqU8WkMlVMKicqU8UTKicVJypTxRsXa611u1hrrdvFWmvdfnhJZao4UZkqJpVJZao4qZhUpopJZaqYVH5TxYnKVDGpfFLFpHKiMlWcqEwVk8oTKlPFpPJNKlPFScWkcqIyVXzSxVpr3S7WWut2sdZatx++rOKNihOVqWKqmFSmipOKSWWqmFSeqJhUpoonKt5QeaJiUplUpooTlZOKSWWqeKJiUjmp+CSVqWJSmSq+6WKttW4Xa611u1hrrdsPX6YyVUwqU8WkMlU8oTJVnKhMFVPFEypTxUnFScWkMlVMKm+onKi8UfFGxYnKExWTyonKVDGpTBVvqEwVn3Sx1lq3i7XWul2stdbN/uAFlZOKSWWq+CSVqeINld9UcaLyRsWJylTxhsoTFScqU8UnqUwVT6hMFScqU8UTKlPFGxdrrXW7WGut28Vaa91++LCKSWWqmFSmiknliYpJZap4o2JS+ZsqJpUnVL6p4gmVqeJEZaqYVKaKk4pJZap4QuWbKj7pYq21bhdrrXW7WGutm/3BB6lMFZPKVPGEyhMVk8pUcaJyUjGpTBVPqEwVk8oTFZPKVHGiclIxqZxUvKEyVUwqJxWTylRxovJExSepTBWfdLHWWreLtda6Xay11u2HD6uYVKaKJ1Smik9SmSpOKk4qJpWpYlKZKp6oOFGZKp6oeKLiRGWqOFH5TSpPVEwqT6hMFZPKb7pYa63bxVpr3S7WWuv2w5dVnKhMFVPFpHJS8YbKVDGpnFRMFScV31QxqUwVk8pU8YbKVDGpPFExqUwVT1Q8ofKGyhMVk8o3Xay11u1irbVuF2utdfvhJZWTipOKSeWkYlKZVKaKT6o4UZkqJpWTikllqnhCZao4qXhD5ZMqPkllqphUTiomlaliUpkqJpUnKiaVqeKNi7XWul2stdbtYq21bj+8VHGiMlU8UTGpTBWTyknFpPKEylRxojJVTCqTylTxRsWkMlVMKlPFpPKGyknFpDJVTBWTylQxVXyTyhsqU8WkMlV80sVaa90u1lrrdrHWWjf7gxdUpoonVL6pYlJ5o2JSmSomlaliUpkqJpWTiknlN1WcqEwVk8pU8YbKExVvqHxSxaRyUvFJF2utdbtYa63bxVpr3ewPXlB5omJSmSqeUJkqnlA5qXhCZar4JpWpYlKZKp5QmSqeUJkqTlROKiaVqWJSmSomlaniCZWp4gmVJyomlanijYu11rpdrLXW7WKttW4/fFjFpPKGylRxojJVPFExqZxUPKEyVUwqJxWfpDJVnKhMFU+oTBVvVEwq36TyhMpU8S+7WGut28Vaa90u1lrr9sM/ruKTVKaKSeUJlROVqeKJipOKSeWJijdUTiomlUllqnhC5QmVqeJE5Y2KJypOVL7pYq21bhdrrXW7WGut2w+/TOVE5ZNUTlROKk5UvkllqphUpopJZVL5pIpJ5YmKE5WTiknlDZWTikllUvmmim+6WGut28Vaa90u1lrrZn/wF6mcVJyovFFxovJExaTyRsUTKk9UnKhMFZPKVHGiMlWcqEwVb6icVEwqT1S8oTJV/KaLtda6Xay11u1irbVu9gcfpDJVnKh8UsWkMlWcqJxUTCpvVJyoTBVvqEwVT6hMFZPKScWJyjdVTCpTxYnKVDGpnFScqDxR8UkXa611u1hrrdvFWmvdfvgylanipOINlTcq3qiYVKaKSWWqOFGZKiaVqeINlaniiYpvqjhReUJlqpgqJpWp4gmVJyq+6WKttW4Xa611u1hrrdsPf1nFpHJScVJxonJSMalMFU9UTCpTxUnFpDKpPFExqUwVU8WJyonKGxWTyonKExWTyqRyUjGpTBXfpDJVvHGx1lq3i7XWul2stdbN/uCDVKaKE5Wp4gmVk4oTlaniROWk4ptUTipOVE4qTlSeqHhC5ZsqJpVPqphUpooTlScqPulirbVuF2utdbtYa62b/cELKlPFicobFZPKScWJyhsVk8pUcaIyVUwqU8Wk8kTFEyonFZPKExUnKt9UMalMFScqU8Wk8kkV33Sx1lq3i7XWul2stdbthy9TmSomlaniROWkYlKZKqaKSWWqeKLiiYpJZar4myomlScqJpUTlaliUnmiYlKZVL6p4r/kYq21bhdrrXW7WGutm/3BB6lMFZPKGxWTylQxqZxUPKEyVXyTylQxqXxTxYnKScUbKk9UTConFScqU8UTKlPFv+xirbVuF2utdbtYa63bD7+s4kRlqjipeKJiUjmpOFGZKk5Unqh4ouJEZaqYVCaVJyomlZOKk4pJZaqYVE4qJpWpYqqYVKaKJ1SmikllqvhNF2utdbtYa63bxVpr3ewPvkhlqjhR+aSKN1ROKiaVT6qYVKaKSeWkYlJ5omJSOamYVKaKE5UnKp5QmSpOVE4qnlD5pIo3LtZa63ax1lq3i7XWuv3wkspU8UbFEypPqEwVJxWTyhMVk8pU8U0Vk8pU8YTKScUbKlPFpHKiMlVMKlPFpHJS8YTKExUnKt90sdZat4u11rpdrLXW7Ycvq3hC5aRiqphU3lCZKqaKJ1ROVE4qpopJ5ZNUTipOVKaKE5Wp4o2KJ1ROKiaVqWJSmSomlX/ZxVpr3S7WWut2sdZatx9eqphUTiqeqHhDZaqYVE5UpoqTiidUnlD5TRUnKlPFpDJVTCqTyknFpDKpnFS8UTGpTBVPVDxRMal80sVaa90u1lrrdrHWWjf7gw9SmSomlX9JxRsqJxWTyknFEyonFScqT1RMKlPFGypTxaQyVZyonFScqEwVk8pU8YbKScU3Xay11u1irbVuF2utdfvhL6uYVKaKE5W/qeKNiidUTiomlZOKb1KZKk4qnlCZKk4qJpWpYqo4qfhNKicVb1ystdbtYq21bhdrrXX74SWVqWJSmSqeUJkqTiomlaniCZU3KqaKJ1SeUJkq3lA5qZhUpopJZao4UZkqTlSeqHhCZaqYVE4qTiqeUPmki7XWul2stdbtYq21bvYHL6h8UsUTKlPFpHJSMam8UXGiclJxojJVTConFZPKVHGiMlWcqEwVv0llqphUpopJ5Y2KSeWJikllqviki7XWul2stdbtYq21bvYH/zCVqeJE5aTiCZXfVDGpTBVPqPymihOVJyomlaniCZWpYlL5l1T8pou11rpdrLXW7WKttW4//OMqTlROKn5TxaTyL6l4QmWqmFTeqDhRmSomlaliUpkqJpWp4kTlpOIJlanib7pYa63bxVpr3S7WWuv2w0sqv6nipOJE5aRiqnij4o2KJ1SeUJkq3lA5qThR+aSKk4pJZap4Q2WqOFGZKiaVqeKTLtZa63ax1lq3i7XWuv3wYRWfpPKGylQxqUwqJxVPqEwVk8pUcaJyUjGpnFQ8oTJVPKEyVXySylRxojJVfFLFExWTylTxTRdrrXW7WGut28Vaa93sD15QmSomlScqJpWp4gmVk4o3VN6oOFGZKk5UvqniROWkYlI5qZhUpooTlaniROW/rOKNi7XWul2stdbtYq21bj/8x6mcVHxTxRMqk8pUMVU8UTGpTBX/ZRVPVEwqU8VUMalMFZPKVHGi8kTFpDJVfNLFWmvdLtZa63ax1lq3H/7HVDyhclIxqXxSxaTySRVPqEwVk8pU8U0qU8WkMlW8oXKiMlVMKlPFVDGpTBUnFd90sdZat4u11rpdrLXW7Ycvq/imiknlpGKqmFROKp5QeaLiRGWqOFGZKiaVJyqeqJhUTiomlUllqphUTiqeqJhUJpUTlaliqjhRmSomlanijYu11rpdrLXW7WKttW4/fJjKb1KZKiaVSeVvqphUTiqeUDlReUJlqjipmFSeUJkqflPFpDJVPKHyRsVJxSddrLXW7WKttW4Xa611sz9Ya60/LtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuF2utdbtYa63b/wG+EXsAIUn50wAAAABJRU5ErkJggg==	2000.00	cancelled	2025-04-04 16:25:25.467148+03	\N	2025-04-04 16:25:25.467148+03	2025-04-10 14:12:04.806505+03	f	\N	completed	2025-04-04 16:39:01.614768+03
8	21	2	7	data:image/png;base64,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	2000.00	cancelled	2025-04-04 16:25:25.467148+03	\N	2025-04-04 16:25:25.467148+03	2025-04-10 14:12:08.826316+03	f	\N	completed	2025-04-04 16:26:03.498127+03
19	34	2	12	data:image/png;base64,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	150.00	purchased	2025-04-10 14:12:47.590955+03	\N	2025-04-10 14:12:47.590955+03	2025-04-10 14:12:47.590955+03	f	\N	\N	\N
20	35	2	12	data:image/png;base64,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	200.00	purchased	2025-04-10 14:12:47.590955+03	\N	2025-04-10 14:12:47.590955+03	2025-04-10 14:12:47.590955+03	f	\N	\N	\N
18	33	2	12	data:image/png;base64,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	90.00	cancelled	2025-04-10 14:12:47.590955+03	\N	2025-04-10 14:12:47.590955+03	2025-04-10 14:14:09.135243+03	f	\N	completed	2025-04-10 14:13:09.09688+03
24	5	2	2	data:image/png;base64,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	800.00	purchased	2025-04-10 15:28:22.339831+03	\N	2025-04-10 15:28:22.339831+03	2025-04-10 15:28:22.339831+03	f	\N	\N	\N
22	17	2	6	data:image/png;base64,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	900.00	cancelled	2025-04-10 14:58:53.227553+03	\N	2025-04-10 14:58:53.227553+03	2025-04-10 15:33:39.24851+03	f	\N	completed	2025-04-10 14:59:03.113849+03
23	4	2	2	data:image/png;base64,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	300.00	cancelled	2025-04-10 15:28:22.339831+03	\N	2025-04-10 15:28:22.339831+03	2025-04-10 15:33:39.24851+03	f	\N	completed	2025-04-10 15:28:28.849256+03
10	21	2	7	data:image/png;base64,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	2000.00	cancelled	2025-04-04 16:25:25.467148+03	\N	2025-04-04 16:25:25.467148+03	2025-04-10 15:41:00.478452+03	f	\N	completed	2025-04-10 15:28:34.506179+03
21	17	2	6	data:image/png;base64,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	900.00	cancelled	2025-04-10 14:58:53.227553+03	\N	2025-04-10 14:58:53.227553+03	2025-04-10 14:58:53.227553+03	f	\N	requested	2025-04-10 15:57:05.325647+03
25	2	2	1	data:image/png;base64,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	1200.00	purchased	2025-04-11 15:36:47.066067+03	\N	2025-04-11 15:36:47.066067+03	2025-04-11 15:36:47.066067+03	f	\N	\N	\N
26	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATLSURBVO3BQY4cSRIEQdNA/f/Lun30UwCJ9GpyuCaCP1K15KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVr0yUtAfpOaGyCTmjeATGomIDdqJiCTmhsgv0nNGydVi06qFp1ULfpkmZpNQJ5Q8wSQJ4BMam6ATGomIJOaGzWbgGw6qVp0UrXopGrRJ18G5Ak1TwCZ1ExAJjU3ar4JyKTmDSBPqPmmk6pFJ1WLTqoWffKPU/MEkEnNBGRSMwGZ1Pw/OaladFK16KRq0Sf/GCCTmgnIpOYJNTdqJiBPqPkvO6ladFK16KRq0SdfpuZvouYGyKRmAjKpmYDcqNmk5m9yUrXopGrRSdWiT5YB+ZPUTEAmNROQSc0EZFIzAZnUTEBugExqboD8zU6qFp1ULTqpWoQ/8h8G5EbNJiA3av6fnVQtOqladFK1CH/kBSCTmgnIJjVvAJnUTEAmNU8AeUPNBGSTmm86qVp0UrXopGrRJ3+YmieA3KiZgLwBZFJzo+YGyKTmm9RMQG7UvHFSteikatFJ1aJP/jAgk5oJyKTmBsikZgLyhJoJyKTmCTUTkBs1E5AbNTdqvumkatFJ1aKTqkWf/DI1E5AbNROQSc2k5kbNjZobNU8AmdRMam6ATGomIH+Tk6pFJ1WLTqoW4Y+8AOQNNROQJ9RMQJ5QMwGZ1ExAJjUTkEnNDZBJzSYgT6h546Rq0UnVopOqRZ/8MjVPqJmAPKFmAjIBmdRMQCY1N2omIDdqJiBvqJnUTEC+6aRq0UnVopOqRZ8sUzMBeQPIE2qeUHOjZgJyo+ZGzRtqJiA3QCY133RSteikatFJ1SL8kReA3KiZgDyhZgIyqZmA3Kh5AsiNmjeA3KjZBORGzRsnVYtOqhadVC365MuATGomIJOaCcik5g0gm4A8oWZSMwF5A8gTajadVC06qVp0UrUIf+QFIN+kZgLyhJoJyBtq3gDyTWomIE+oeeOkatFJ1aKTqkWfLFMzAXkDyKTmBsiNmieATEAmNROQGzU3QCY136Rm00nVopOqRSdViz75ZWomIDdqJiBPAJnUbAIyqXkCyA2QSc0EZFIzqbkBMql546Rq0UnVopOqRZ/8YWpugExqboDcAJnU3KiZgNwAmdRsAnID5E86qVp0UrXopGoR/sh/GJA31ExAJjVvAHlCzRNAJjVPAJnUvHFSteikatFJ1aJPXgLym9RMaiYgk5oJyBNAbtRMQDYBmdQ8AWRSM6nZdFK16KRq0UnVok+WqdkE5AbIpGaTmifUPAHkRs0ban7TSdWik6pFJ1WLPvkyIE+oeQPIpGZSMwGZ1ExAbtRMQG7U3AB5A8gbat44qVp0UrXopGrRJ/84IG+ouQEyqdmk5gkgk5oJyDedVC06qVp0UrXok3+cmgnIpOYGyI2aN9TcAJnUTEAmNROQGzWbTqoWnVQtOqla9MmXqfkmNROQGzUTkBs1E5BNQL5JzQTkm06qFp1ULTqpWvTJMiC/CcikZgIyqblR8wSQJ9RMaiYgN0AmNTdAJjXfdFK16KRq0UnVIvyRqiUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WLTqoWnVQtOqladFK16KRq0UnVov8BzHhJDlp+iWgAAAAASUVORK5CYII=	100.00	purchased	2025-04-14 10:55:29.739593+03	\N	2025-04-14 10:55:29.739593+03	2025-04-14 10:55:29.739593+03	t	2025-04-14 11:03:19.661254+03	\N	\N
28	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATESURBVO3BQY4bSRAEwfAC//9lXx3zVECjkyPNIszwj1QtOaladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhZ98hKQn6RmAnKjZhOQSc0EZFJzA2RSMwH5SWreOKladFK16KRq0SfL1GwC8gaQbwIyqbkBMql5Qs0mIJtOqhadVC06qVr0yZcBeULN36TmBsgTQG6ATGqeAPKEmm86qVp0UrXopGrRJ7+cmjeA3AB5AsiNmv+zk6pFJ1WLTqoWffLLAdkE5Ak1TwC5UfObnVQtOqladFK16JMvU/NNan4SkAnIE2omIG+o+ZecVC06qVp0UrXok2VAfhKQSc0EZFIzAZnUTEAmNROQSc0EZBOQf9lJ1aKTqkUnVYs+eUnN36RmAnIDZJOab1Lzm5xULTqpWnRSteiTl4BMam6A/CQ1E5BJzRNAJjUTkBsgk5oJyKTmBsikZgLyhJo3TqoWnVQtOqla9MlLaiYgN2omIJOaJ4BsAvIEkBs1E5A3gNwAuVHzTSdVi06qFp1ULfpkmZoJyBtAbtRMQG7U3KiZgExqboBMQCY1E5An1ExAJjUTkJ90UrXopGrRSdUi/CP/Y0AmNTdAJjU3QG7UTEAmNROQSc0E5EbNDZAbNW+cVC06qVp0UrXok2VAJjU3QN5Q8waQTWomIDdAJjUTkBs1E5BJzY2aTSdVi06qFp1ULcI/8gKQGzUTkCfUTEBu1DwB5Ak1PwnIJjUTkEnNGydVi06qFp1ULfrkJTVPqJmATGomIJOaJ4DcqJmAPAHkm9TcAPmXnFQtOqladFK16JOXgExqJiCTmhsgk5o31ExAnlDzhJoJyKRmAjKpmYBMaiY1N0Bu1Gw6qVp0UrXopGrRJy+peQLIpOYGyKTmbwIyqblR8wSQSc0EZFIzAZnUTEAmNZtOqhadVC06qVqEf+QFIJOaGyBPqJmATGq+CchPUvMEkEnNBGRS800nVYtOqhadVC36ZBmQSc2kZgIyqZmAPAFkUnMD5EbNBORGzQTkCSBPqJmATGomIDdq3jipWnRSteikatEnf5maCcikZhOQJ4BMap5QMwG5UTMBmdRMQG6A/KSTqkUnVYtOqhbhH3kByBtqboA8oWYCMqmZgNyomYBMam6ATGomIJvUTEBu1Gw6qVp0UrXopGrRJy+p+SY1N0Bu1ExAJjUTkAnIpGYCMqmZ1ExAbtQ8AeRfclK16KRq0UnVok9eAvKT1NwAmdTcALlRc6NmArIJyKTmCTU/6aRq0UnVopOqRZ8sU7MJyBNqJiA3aiYgN0DeUDMBuVGzCcikZtNJ1aKTqkUnVYs++TIgT6jZpGYCMgH5SUBugPxmJ1WLTqoWnVQt+uR/BsikZlJzA2QCMqm5ATKpmYBMajYBmdT8pJOqRSdVi06qFn3yy6mZgHwTkEnNDZBvAvIGkEnNGydVi06qFp1ULfrky9T8S4DcqJmAbFLzTWomIJOaCcimk6pFJ1WLTqoWfbIMyE8CsgnIpOYJNROQGyBPqJnU3Ki5UbPppGrRSdWik6pF+EeqlpxULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WL/gPQNhRwUyn0YgAAAABJRU5ErkJggg==	100.00	purchased	2025-04-14 11:18:08.571567+03	\N	2025-04-14 11:18:08.571567+03	2025-04-14 11:18:08.571567+03	t	2025-04-14 11:19:17.234821+03	\N	\N
27	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAAToSURBVO3BQY4jRxAEwfAC//9l1xzzVECjk7PSKszwR6qWnFQtOqladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYs+eQnIb1JzA+QJNTdAJjUTkEnNDZBJzQ2Q36TmjZOqRSdVi06qFn2yTM0mIE+oeQLIE0AmNU+oeUPNJiCbTqoWnVQtOqla9MmXAXlCzRNAJjVvqPlNQCY1TwB5Qs03nVQtOqladFK16JO/HJBJzQ2QSc0EZFIzAblRM6n5m5xULTqpWnRSteiT/xkgN2pu1DyhZgJyo+a/7KRq0UnVopOqRZ98mZrfBOQJNROQSc0EZFIzqZmATGomIG+o+Tc5qVp0UrXopGrRJ8uA/ElqJiCTmgnIpGYCMqmZgExqvgnIv9lJ1aKTqkUnVYvwR/7DgNyomYDcqLkBcqPm/+ykatFJ1aKTqkX4Iy8AmdRMQDapuQFyo2YCcqPmCSCTmhsgk5oJyCY133RSteikatFJ1aJPXlLzhJoJyI2aTUCeADKpuVEzAblR801qJiA3at44qVp0UrXopGoR/sgLQG7U3AB5Q80NkBs1E5BJzQRkUjMBmdQ8AWRSMwG5UfMnnVQtOqladFK1CH/kFwGZ1ExAJjUTkCfUTEAmNd8E5Ak1E5BJzQRkUvMnnVQtOqladFK1CH/kBSA3aiYg36RmAjKpmYDcqJmATGomIDdqfhOQJ9S8cVK16KRq0UnVIvyRLwIyqZmATGreADKpmYBMam6ATGreAPJNam6A3Kh546Rq0UnVopOqRZ/8MiCTmhsgk5oJyBNqnlAzAZnUTEBu1ExAnlAzAbkBMqn5ppOqRSdVi06qFuGPvADkDTXfBGRSMwGZ1ExAnlAzAXlDzSYgN2reOKladFK16KRq0SfL1DwBZFIzAZnUPKHmRs0E5A0gN2omIJuAPKFm00nVopOqRSdViz75MiA3aiYgk5obIE+omYA8oeYNIJOaCcgE5Ak1E5AbIJOaN06qFp1ULTqpWvTJHwZkUjMBeULNDZBJzQ2QCcikZgIyqZnUPKHmm9RsOqladFK16KRqEf7IC0AmNTdAnlAzAXlCzQ2QSc0EZFIzAZnUTEBu1ExAbtRMQCY1TwCZ1LxxUrXopGrRSdWiT74MyBNqJiCTmgnIpGYC8oaaCcikZgJyo2YC8gSQGyB/0knVopOqRSdVi/BH/sOA3Ki5AXKj5gbIpOYJIJOaJ4BMap4AMql546Rq0UnVopOqRZ+8BOQ3qZnU3ACZ1ExqJiATkBs1E5BNQCY1TwCZ1ExqNp1ULTqpWnRSteiTZWo2AbkBMqnZpOYJNTdAnlDzhprfdFK16KRq0UnVok++DMgTar4JyI2aCciNmgnIjZoJyATkDSBvqHnjpGrRSdWik6pFn/xlgDyh5kbNDZAbNW+oeQLIpGYC8k0nVYtOqhadVC365C+jZgJyA2RSMwG5UXMDZFIzqbkBMqmZgNwAuVGz6aRq0UnVopOqRZ98mZpvUnOj5gbIBGRScwNkUvMEkE1qboB800nVopOqRSdViz5ZBuQ3AZnUTEBu1ExAboDcAHlCzQTkBsik5gbIpOabTqoWnVQtOqlahD9SteSkatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WLTqoWnVQtOqla9A9chFUjY2iobwAAAABJRU5ErkJggg==	100.00	purchased	2025-04-14 11:18:08.571567+03	\N	2025-04-14 11:18:08.571567+03	2025-04-14 11:18:08.571567+03	t	2025-04-14 11:23:07.291907+03	\N	\N
29	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATfSURBVO3BQY4cSRIEQdNA/f/Lun30UwCJ9GoOuSaCP1K15KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVr0yUtAfpOaJ4BMap4AMqmZgExqJiBPqJmA/CY1b5xULTqpWnRSteiTZWo2AXkCyKRmAvIGkEnNBORGzRtqNgHZdFK16KRq0UnVok++DMgTap4A8oSab1IzAbkBMql5AsgTar7ppGrRSdWik6pFn/yfAfKEmgnIpGYC8oSaf8lJ1aKTqkUnVYs++ceoeUPNjZobNTdAbtT8zU6qFp1ULTqpWvTJl6n5TUBu1ExAJiCTmgnIpOYGyKRmk5r/kpOqRSdVi06qFn2yDMifpGYC8oSaCcikZgIyqXkCyKTmBsh/2UnVopOqRSdViz55Sc3fBMgTaiYgT6iZgExqbtT8TU6qFp1ULTqpWoQ/8gKQSc0EZJOabwIyqXkCyKTmBsikZgKySc03nVQtOqladFK16JNlQCY1E5AbNU8AmdQ8AeQGyKTmRs0E5EbNN6mZgNyoeeOkatFJ1aKTqkWfLFMzAblRcwNkUnMDZFLzhpoJyKRmAnKjZgJyo2YCcqPmRs03nVQtOqladFK16JOX1ExAJjUTkBsgk5obNZvU3Ki5UXMD5EbNBGRSMwH5LzmpWnRSteikahH+yCIgk5o3gDyh5gkgN2omIJOaCcik5gbIpGYTkCfUvHFSteikatFJ1aJPXgIyqbkB8oSaGyA3QCY1N2omIJOaGzUTkBs1E5A31ExqJiDfdFK16KRq0UnVok/+MDUTkAnIE0A2qZmA3Ki5UTMBeULNBOQGyKTmm06qFp1ULTqpWoQ/sgjIpOYGyKTmCSCb1ExAJjUTkEnNE0Bu1GwCcqPmjZOqRSdVi06qFuGPvABkUnMDZFJzA+QJNTdAfpOaJ4BMap4A8oSaTSdVi06qFp1ULcIfeQHIjZobIJOaN4BMam6APKHmCSC/Sc0E5Ak1b5xULTqpWnRSteiTZWpugNwAeUPNBORGzQ2QCciNmhs1E5AbNd+kZtNJ1aKTqkUnVYs++TIgN2omIJOaGyB/kpobNROQSc0EZAIyqZmATGomNTdAJjVvnFQtOqladFK16JNfpuYJIDdqJiCTmgnIBGRSM6m5AXKjZlIzAXkCyA2QP+mkatFJ1aKTqkX4I38xIJOaJ4DcqHkDyKRmAjKpeQLIpOYJIJOaN06qFp1ULTqpWvTJS0B+k5pJzQRkUjMBeQLIjZobNROQJ4BMap4AMqmZ1Gw6qVp0UrXopGrRJ8vUbAJyA2RSc6PmBsik5gbIpGYC8oaaN9T8ppOqRSdVi06qFn3yZUCeUPNNQG7UTEBu1ExAJjU3QCYgbwB5Q80bJ1WLTqoWnVQt+uQfB2RSMwGZgExqboBMaiYgk5on1LwB5DedVC06qVp0UrXok38MkBsgk5oJyA2QSc0bam6ATGomIDdqJiCTmk0nVYtOqhadVC365MvUfJOaN4BMap4AMqmZ1NwA2aTmTzqpWnRSteikatEny4D8JiBPqNmkZgIyqblRMwG5ATKpuQEyqfmmk6pFJ1WLTqoW4Y9ULTmpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WLTqoW/Q+1J08gzredXgAAAABJRU5ErkJggg==	100.00	purchased	2025-04-14 11:25:12.922298+03	\N	2025-04-14 11:25:12.922298+03	2025-04-14 11:25:12.922298+03	t	2025-04-14 11:42:22.218656+03	\N	\N
30	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATFSURBVO3BQY4bSRAEwfAC//9l3znmqYBGJ0fSIszwR6qWnFQtOqladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYs+eQnIb1IzAXlCzRtAJjUTkBs1E5BJzQTkN6l546Rq0UnVopOqRZ8sU7MJyBNqJiATkE1AbtTcqHlCzSYgm06qFp1ULTqpWvTJlwF5Qs03qXkDyBtAbtQ8AeQJNd90UrXopGrRSdWiT/5xam7UTEBu1ExAnlAzAZnU/J+dVC06qVp0UrXok38ckBs1N2omIE+omYBMam6ATGr+ZSdVi06qFp1ULfrky9R8k5obIDdAJjU3QCYgN0AmNZOaN9T8TU6qFp1ULTqpWvTJMiC/Ccik5kbNBOQGyKRmAjKpmYDcAJnU3AD5m51ULTqpWnRSteiTl9T8SWqeADKpeUPNN6n5l5xULTqpWnRSteiTl4BMam6AfJOabwIyqblR8wSQSc0NkEnNBOQJNW+cVC06qVp0UrUIf2QRkEnNDZBJzRtAJjUTkG9SMwGZ1ExAbtRMQN5Q800nVYtOqhadVC365MuA3KiZgNyouVFzo+YJIJOaGyDfpGYCMqmZgPymk6pFJ1WLTqoWffJlaiYgN2pugExqboDcqJmATGpugExqnlAzAbkB8oSaCciNmjdOqhadVC06qVr0yTI1bwDZpOY3AXlCzaRmAnKjZgIyqblRs+mkatFJ1aKTqkX4I4uATGpugNyoeQPIJjVPAHlCzQRkk5oJyKTmjZOqRSdVi06qFn3yEpBJzRtqJiCTmhsgN2pugDwBZFIzqZmATGomIJOaGyB/k5OqRSdVi06qFuGP/CIgT6i5AfKGmgnIpOYGyI2aN4BMap4AMqn5ppOqRSdVi06qFn3yZUBu1NwAeULNDZA3gExqJiATkEnNBORGzQRkUjMBmdRMQCY1m06qFp1ULTqpWvTJS0Bu1NwAuVHzBpAbIJOaCcgmIDdqbtRMQCY1E5BJzTedVC06qVp0UrXoky8DMqm5UTMBmdRMQCY1bwCZ1NwAuVEzAbkB8oSaCcikZgJyo+aNk6pFJ1WLTqoW4Y+8AORGzQ2QSc0NkEnNE0DeUHMD5EbNE0AmNROQTWreOKladFK16KRqEf7IC0DeUDMBuVFzA+RGzQTkRs0mIN+kZgJyo2bTSdWik6pFJ1WL8Ef+YUAmNW8AuVGzCcik5gkgk5oJyI2aTSdVi06qFp1ULfrkJSC/Sc0NkCfU3Kh5AsikZgLyBJBJzQ2QSc1vOqladFK16KRq0SfL1GwC8oSaP0nNJjVPqLkBMqnZdFK16KRq0UnVok++DMgTat4A8oSaN4BsAvKbgExq3jipWnRSteikatEn/zNqJiA3QG6ATGqeUDMBmdRsAvKEmk0nVYtOqhadVC365B+nZgLyhJoJyBtqJiDfBORGzQRkAjKpeeOkatFJ1aKTqkWffJmaP0nNBGQCcqPmCSCTmt+kZgIyqZmAbDqpWnRSteikahH+yAtAfpOaCcik5g0gk5ongNyomYA8oeZvdlK16KRq0UnVIvyRqiUnVYtOqhadVC06qVp0UrXopGrRSdWik6pFJ1WLTqoWnVQtOqladFK16KRq0UnVov8AG4o1KAJqFksAAAAASUVORK5CYII=	100.00	purchased	2025-04-14 11:25:12.922298+03	\N	2025-04-14 11:25:12.922298+03	2025-04-14 11:25:12.922298+03	t	2025-04-14 11:31:29.493979+03	\N	\N
31	36	2	34	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAATXSURBVO3BQY4bSRAEwfAC//9l3znmqYBGJ0daIczwR6qWnFQtOqladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYs+eQnIb1JzA+RGzQRkUjMBmdRMQCY1E5An1ExAfpOaN06qFp1ULTqpWvTJMjWbgDyhZgLyBJAbIJOaCciNmjfUbAKy6aRq0UnVopOqRZ98GZAn1DwBZFJzA2RSs0nNDZBJzRtAnlDzTSdVi06qFp1ULfrkHwPkCSA3aiYgk5oJyI2af9lJ1aKTqkUnVYs++ceomYBMat5Q84SaCciNmv+zk6pFJ1WLTqoWffJlan4TkDeATGomIJOaSc0EZFIzAXlDzd/kpGrRSdWik6pFnywD8iepmYDcAJnUTEAmNROQSc03AfmbnVQtOqladFK16JOX1PzN1ExAJjU3aiYgm9TcqPk/OaladFK16KRq0ScvAZnUTEA2qZnUTEAmNU8AmdRMam6AbAKySc03nVQtOqladFK16JNfpuYNIJOaSc0TQG6ATGqeUDMBuVGzSc0E5EbNGydVi06qFp1ULcIfeQHIjZongNyouQGySc0EZFJzA2RSMwG5UTMBuVHzJ51ULTqpWnRSteiTv5yaGyBPqHlDzRNqbtTcAJnUTED+JidVi06qFp1ULfpkmZoJyKTmCSCTmhs1TwC5UTMBmdRMQN5QM6m5UXMD5Ak1b5xULTqpWnRSteiTl9TcqHlDzRNAbtTcqJmATGpu1NwAmdRMQN5QM6mZgHzTSdWik6pFJ1WLPlkGZFJzA2RSMwF5Q80EZFJzo2YC8oSaSc0baiYgN0AmNd90UrXopGrRSdUi/JH/MSA3at4A8oSaCciNmgnIpGYTkBs1b5xULTqpWnRSteiTLwMyqXkCyBNqJiCTmgnIG2omIDdqJiCbgDyhZtNJ1aKTqkUnVYvwR14AMqmZgNyomYBMat4AcqNmAnKjZgIyqbkBMqmZgLyhZgLyhJo3TqoWnVQtOqla9MkvU/MEkEnNBOQNIJOaCcgEZFIzAblRMwG5UfNNajadVC06qVp0UrUIf+QFIJOaGyCTmieA3Ki5ATKpuQEyqXkCyKTmBsiNmgnIpOYJIJOaN06qFp1ULTqpWvTJlwG5ATKpmYC8AWRSMwGZ1ExqJiBPqLkB8gSQGyB/0knVopOqRSdVi/BH/seA3KiZgExqJiCTmjeATGomIJOaJ4BMap4AMql546Rq0UnVopOqRfgjLwD5TWq+CcgTaiYgb6iZgExqJiBPqPmmk6pFJ1WLTqoWfbJMzSYgN0AmNROQN9RMQCYgk5oJyBtqnlDzJ51ULTqpWnRSteiTLwPyhJpNat4AcqNmAjKpuQEyAXkDyBtq3jipWnRSteikatEn/zggk5obIJOaGyCTmgnIpOYJNZuAfNNJ1aKTqkUnVYs++ccAmdRsAnID5Ak1N0AmNROQGzU3ajadVC06qVp0UrXoky9T801qJiATkEnNBOQGyI2aGyA3QDap+ZNOqhadVC06qVr0yTIgvwnIpGYCcqNmAvIGkEnNjZoJyA2QSc0NkEnNN51ULTqpWnRStQh/pGrJSdWik6pFJ1WLTqoWnVQtOqladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteg//RpJI/SXJFYAAAAASUVORK5CYII=	100.00	purchased	2025-04-14 11:25:12.922298+03	\N	2025-04-14 11:25:12.922298+03	2025-04-14 11:25:12.922298+03	t	2025-04-14 11:39:20.395017+03	\N	\N
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (user_id, preferred_categories, location_latitude, location_longitude, notification_settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, profile_image, google_id, facebook_id, role, created_at, updated_at, reset_token, reset_token_expire) FROM stdin;
4	valytest	test@gmail.com	$2b$10$dP5yIDwkZAMRVhrjeELOb.Pw3qtFYJNCFzS30AOGy1UJfrl8aDLWK	\N	\N	\N	user	2025-03-13 15:31:45.610675+02	2025-03-13 15:31:45.610675+02	\N	\N
5	cry	cry@test.com	$2b$10$wZLjJvtg9BKsnOXMqoi23eGur4N1IfAE0Fl5EWCYfAZ6DVHP1lvfe	\N	\N	\N	user	2025-03-13 15:38:08.567392+02	2025-03-13 15:38:08.567392+02	\N	\N
6	Valy	braconieruvalica99@gmail.com	$2b$10$fOOLyLircj5k2kX1RkjY/emjauJ7FHVp36kPwRa9vZ9zzAYPCxrFO	\N	\N	\N	user	2025-03-13 15:43:07.187951+02	2025-03-13 15:43:07.187951+02	\N	\N
8	adminuser	admin@eventhub.com	$2b$10$sZ4J5EFGdhxgLzuWERMc.u7g.ABXAxurpv0miZiSQ2riL0CD0kdfu	\N	\N	\N	admin	2025-04-04 17:56:29.331547+03	2025-04-04 17:56:29.331547+03	\N	\N
2	Valentin Gabriel	ghitavalentin70@yahoo.com	$2b$10$EQHp0CtANQ0Iap4r.pfyLO5CKS9r69f/NWmqGmxxNidOC1lMY2Egu	\N	\N	\N	admin	2025-03-08 11:40:52.49061+02	2025-03-08 11:40:52.49061+02	\N	\N
1	Admin	admin@eventhub.ro	$2b$10$OxhiTQKEASLC7ZCnmOc37Otu1S.XSB.KCb0WAbiRJUqiF3xSlZwVe	\N	\N	\N	user	2025-03-06 14:36:38.539037+02	2025-03-06 14:36:38.539037+02	\N	\N
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 5, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 34, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 18, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: social_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_accounts_id_seq', 2, true);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 19, true);


--
-- Name: ticket_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_types_id_seq', 36, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 31, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: payment_tickets payment_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tickets
    ADD CONSTRAINT payment_tickets_pkey PRIMARY KEY (payment_id, ticket_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_provider_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_provider_provider_id_key UNIQUE (provider, provider_id);


--
-- Name: subcategories subcategories_category_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_slug_key UNIQUE (category_id, slug);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: ticket_types ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_date ON public.events USING btree (date);


--
-- Name: idx_tickets_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_event_id ON public.tickets USING btree (event_id);


--
-- Name: idx_tickets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_user_id ON public.tickets USING btree (user_id);


--
-- Name: events events_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: events events_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id);


--
-- Name: events events_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: payment_tickets payment_tickets_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tickets
    ADD CONSTRAINT payment_tickets_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payment_tickets payment_tickets_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_tickets
    ADD CONSTRAINT payment_tickets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: social_accounts social_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: ticket_types ticket_types_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_type_id_fkey FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

