import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { addDoc, collection, doc, onSnapshot, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import jabonesDeportivos from "./assets/pinguinitos-producto-adjunto.png"
import { auth, db, storage } from "./firebase"

type Product = {
  id: number
  title: string
  category: string
  description: string
  price: number
  image: string
  badge?: string
}

type CartItem = Product & { quantity: number }

type Customer = {
  name: string
  identification: string
  email: string
  phone: string
  address: string
  payment: string
}

type Order = {
  id: string
  date: string
  customer: Customer
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

type SocialLinks = {
  youtube: string
  instagram: string
  facebook: string
}

const initialSocials: SocialLinks = {
  youtube: "youtube.com/@pinguinitos",
  instagram: "instagram.com/pinguinitos",
  facebook: "facebook.com/pinguinitos",
}

const toUrl = (value: string) =>
  value.startsWith("http") ? value : `https://${value}`

const photos = {
  hero: "https://images.unsplash.com/photo-1546552768-9e3a94b38a59?auto=format&fit=crop&w=1400&q=85",
  lavender:
    "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=900&q=85",
  oatmeal:
    "https://images.unsplash.com/photo-1618840313409-66c0d92d6f26?auto=format&fit=crop&w=900&q=85",
  charcoal:
    "https://images.unsplash.com/photo-1612800083273-24ea5c80313d?auto=format&fit=crop&w=900&q=85",
  calendula:
    "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=85",
  coffee:
    "https://images.unsplash.com/photo-1605264964528-06403738d6dc?auto=format&fit=crop&w=900&q=85",
  botanical:
    "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?auto=format&fit=crop&w=900&q=85",
}

const initialProducts: Product[] = [
  {
    id: 1,
    title: "Lavanda Serena",
    category: "Herbales",
    description:
      "Jabón relajante con flores de lavanda y aceites vegetales nutritivos.",
    price: 4500,
    image: photos.lavender,
    badge: "Favorito",
  },
  {
    id: 2,
    title: "Avena & Miel",
    category: "Piel sensible",
    description: "Limpieza suave y cremosa con avena molida y miel natural.",
    price: 4200,
    image: photos.oatmeal,
    badge: "Piel sensible",
  },
  {
    id: 3,
    title: "Carbón Purificante",
    category: "Limpieza profunda",
    description:
      "Carbón activado y árbol de té para una limpieza fresca y equilibrada.",
    price: 4800,
    image: photos.charcoal,
    badge: "Nuevo",
  },
  {
    id: 4,
    title: "Caléndula Suave",
    category: "Piel sensible",
    description:
      "Caléndula macerada para limpiar y consentir las pieles delicadas.",
    price: 4500,
    image: photos.calendula,
  },
  {
    id: 5,
    title: "Café & Canela",
    category: "Exfoliantes",
    description:
      "Exfoliación estimulante con café molido y un cálido aroma a canela.",
    price: 5000,
    image: photos.coffee,
  },
  {
    id: 6,
    title: "Jardín Botánico",
    category: "Herbales",
    description:
      "Hierbas, arcilla verde y aceites esenciales para una piel fresca.",
    price: 4800,
    image: photos.botanical,
    badge: "Edición limitada",
  },
  {
    id: 7,
    title: "Trío Deportivo",
    category: "Edición limitada",
    description:
      "Jabones artesanales con divertidas formas deportivas y una fragancia fresca.",
    price: 5200,
    image: jabonesDeportivos,
    badge: "Nuevo",
  },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
  }).format(price)

function Icon({
  children,
  size = 20,
  className = "",
}: {
  children: ReactNode
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="m20 20-4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
const BagIcon = () => (
  <Icon>
    <path
      d="M5 8.5h14l-1 12H6l-1-12Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M9 9V6.5a3 3 0 0 1 6 0V9"
      stroke="currentColor"
      strokeWidth="1.7"
    />
  </Icon>
)
const ArrowIcon = () => (
  <Icon size={18}>
    <path
      d="M5 12h14m-5-5 5 5-5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </Icon>
)
const CloseIcon = () => (
  <Icon>
    <path
      d="m6 6 12 12M18 6 6 18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
const PlusIcon = () => (
  <Icon size={18}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </Icon>
)
const TrashIcon = () => (
  <Icon size={18}>
    <path
      d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </Icon>
)
const EditIcon = () => (
  <Icon size={18}>
    <path
      d="m14.5 5.5 4 4M4 20l1-4L16 5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L8 19l-4 1Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </Icon>
)
const LockIcon = () => (
  <Icon size={21}>
    <rect
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.7"
      width="14"
      x="5"
      y="10"
    />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
  </Icon>
)
const InstagramIcon = () => (
  <Icon size={22}>
    <rect
      height="16"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.7"
      width="16"
      x="4"
      y="4"
    />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="17.5" cy="6.7" fill="currentColor" r="1" />
  </Icon>
)
const YoutubeIcon = () => (
  <Icon size={23}>
    <path
      d="M21 8.2a2.7 2.7 0 0 0-1.9-1.9C17.4 5.8 12 5.8 12 5.8s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 8.2a28 28 0 0 0-.5 4.1A28 28 0 0 0 3 16.4a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.1 28 28 0 0 0-.5-4.1Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="m10 15.3 5-3-5-3v6Z" fill="currentColor" />
  </Icon>
)
const FacebookIcon = () => (
  <Icon size={22}>
    <path
      d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.4-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.4v2H8.5v3h2.8v8H14Z"
      fill="currentColor"
    />
  </Icon>
)

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("pinguinitos-products-v2")
    if (!saved) return initialProducts
    const savedProducts = JSON.parse(saved) as Product[]
    return savedProducts.some((product) => product.id === 7)
      ? savedProducts
      : [...savedProducts, initialProducts.find((product) => product.id === 7)!]
  })
  const [socials, setSocials] = useState<SocialLinks>(() => {
    const saved = localStorage.getItem("pinguinitos-socials-v1")
    return saved ? JSON.parse(saved) : initialSocials
  })
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("pinguinitos-orders-v1")
    return saved ? JSON.parse(saved) : []
  })
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todos")
  const [sort, setSort] = useState("Destacados")
  const [editing, setEditing] = useState<Product | null>(null)
  const [toast, setToast] = useState("")

  const storeRef = doc(db, "pinguinitos", "store")

  useEffect(() => {
    const unsubscribe = onSnapshot(
      storeRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          if (isAdmin) void setDoc(storeRef, { products, socials })
          return
        }
        const data = snapshot.data()
        if (Array.isArray(data.products)) setProducts(data.products as Product[])
        if (data.socials) setSocials(data.socials as SocialLinks)
      },
      () => setToast("No se pudo sincronizar con Firebase."),
    )
    return unsubscribe
  }, [isAdmin])

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) =>
        setIsAdmin(user?.email === "admin@pinguinitos.com"),
      ),
    [],
  )

  useEffect(() => {
    if (!isAdmin) {
      setOrders([])
      return
    }
    return onSnapshot(
      collection(db, "orders"),
      (snapshot) =>
        setOrders(
          snapshot.docs
            .map((item) => item.data() as Order)
            .sort((a, b) => b.date.localeCompare(a.date)),
        ),
      () => setToast("No se pudo cargar el informe de ventas."),
    )
  }, [isAdmin])

  const saveStore = (data: Record<string, unknown>) =>
    setDoc(storeRef, data, { merge: true }).catch(() =>
      setToast("No se pudieron guardar los cambios en Firebase."),
    )

  const saveOrder = (order: Order) =>
    addDoc(collection(db, "orders"), order).catch(() =>
      setToast("No se pudo registrar el pedido en Firebase."),
    )

  const uploadProductImage = async (file: File) => {
    const fileRef = ref(storage, `products/${Date.now()}-${file.name}`)
    await uploadBytes(fileRef, file, { contentType: file.type })
    return getDownloadURL(fileRef)
  }
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const categories = [
    "Todos",
    ...Array.from(new Set(products.map((p) => p.category))),
  ]
  const filtered = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "Todos" || product.category === category) &&
        `${product.title} ${product.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    if (sort === "Menor precio")
      return [...result].sort((a, b) => a.price - b.price)
    if (sort === "Mayor precio")
      return [...result].sort((a, b) => b.price - a.price)
    return result
  }, [products, category, search, sort])

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const addToCart = (product: Product) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id)
      if (exists) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
    setToast(`${product.title} se agregó a tu bolsa`)
  }

  const updateQuantity = (id: number, delta: number) =>
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    )

  const scrollToProducts = () =>
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" })

  const openAdministration = () => {
    if (isAdmin) setAdminOpen(true)
    else setLoginOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#1d2620]">
      <div className="bg-[#1d3b2a] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-[#f8f7f2]">
        Envío gratuito en compras mayores a ₡25.000 · Entregas a todo Costa Rica
      </div>

      <header className="sticky top-0 z-30 border-b border-[#1d2620]/10 bg-[#f8f7f2]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button
            className="group flex flex-col items-start gap-0.5"
            onClick={() => {
              setAdminOpen(false)
              setLoginOpen(false)
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <span className="font-serif text-2xl tracking-tight">
              Pinguinitos
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0d2038]/55">
              Para que huelas más rico.
            </span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <button className="nav-link" onClick={scrollToProducts}>
              Tienda
            </button>
            <button
              className="nav-link"
              onClick={() =>
                document
                  .getElementById("historia")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Nosotros
            </button>
            <button
              className="nav-link"
              onClick={() =>
                document
                  .getElementById("conecta")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Comunidad
            </button>
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-[#1d2620]/5 sm:block"
              onClick={openAdministration}
            >
              Administración
            </button>
            <button
              aria-label="Abrir carrito"
              className="relative grid size-10 place-items-center rounded-full transition hover:bg-[#1d2620]/5"
              onClick={() => setCartOpen(true)}
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-[#e46f44] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-8">
          <div className="flex min-h-[560px] flex-col justify-center rounded-[2rem] bg-[#e7ddcf] px-7 py-12 sm:px-12 lg:px-16">
            <span className="mb-8 w-fit rounded-full border border-[#1d2620]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em]">
              Jabones hechos con cariño
            </span>
            <h1 className="max-w-xl font-serif text-5xl leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-7xl">
              Naturalmente,{" "}
              <em className="font-normal text-[#b45132]">suave contigo.</em>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#1d2620]/70 sm:text-lg">
              Jabones artesanales elaborados en pequeños lotes con ingredientes
              naturales que cuidan tu piel.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button className="primary-button" onClick={scrollToProducts}>
                Descubrir jabones <ArrowIcon />
              </button>
              <span className="text-sm text-[#1d2620]/60">
                Envíos desde 24h
              </span>
            </div>
          </div>
          <div className="group relative min-h-[460px] overflow-hidden rounded-[2rem] lg:min-h-[560px]">
            <img
              alt="Selección de jabones artesanales Pinguinitos"
              className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]"
              src={photos.hero}
            />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between rounded-2xl bg-[#f8f7f2]/90 p-5 backdrop-blur-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#1d2620]/50">
                  Selección del mes
                </p>
                <p className="mt-1 font-serif text-xl">Ritual de suavidad</p>
              </div>
              <button
                aria-label="Ver selección Ritual de suavidad"
                className="grid size-11 place-items-center rounded-full bg-[#1d3b2a] text-white"
                onClick={scrollToProducts}
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
          id="productos"
        >
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Nuestros jabones</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                Hechos para cuidar
              </h2>
            </div>
            <div className="relative w-full md:w-72">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1d2620]/50">
                <SearchIcon />
              </span>
              <input
                aria-label="Buscar productos"
                className="w-full rounded-full border border-[#1d2620]/15 bg-transparent py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-[#1d3b2a]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="¿Qué estás buscando?"
                value={search}
              />
            </div>
          </div>
          <div className="mt-9 flex flex-col justify-between gap-4 border-b border-[#1d2620]/10 pb-5 sm:flex-row sm:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    category === item
                      ? "bg-[#1d3b2a] text-white"
                      : "bg-[#eae8df] hover:bg-[#dedbd0]"
                  }`}
                  key={item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <select
              aria-label="Ordenar productos"
              className="bg-transparent text-sm font-medium outline-none"
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              <option>Destacados</option>
              <option>Menor precio</option>
              <option>Mayor precio</option>
            </select>
          </div>

          {filtered.length ? (
            <div className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <article className="product-card group" key={product.id}>
                  <div className="relative aspect-[4/4.6] overflow-hidden rounded-3xl bg-[#ebe8df]">
                    <img
                      alt={product.title}
                      className="size-full object-cover transition duration-700 group-hover:scale-105"
                      src={product.image}
                    />
                    {product.badge && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#f8f7f2]/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
                        {product.badge}
                      </span>
                    )}
                    <button
                      className="absolute inset-x-4 bottom-4 flex translate-y-2 items-center justify-center gap-2 rounded-full bg-[#1d3b2a] py-3.5 text-sm font-semibold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
                      onClick={() => addToCart(product)}
                    >
                      Agregar a la bolsa <PlusIcon />
                    </button>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#1d2620]/45">
                        {product.category}
                      </p>
                      <h3 className="mt-1.5 font-serif text-2xl">
                        {product.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#1d2620]/60">
                        {product.description}
                      </p>
                    </div>
                    <p className="mt-5 whitespace-nowrap font-semibold">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-serif text-3xl">
                No encontramos coincidencias
              </p>
              <button
                className="mt-4 text-sm font-semibold underline underline-offset-4"
                onClick={() => {
                  setSearch("")
                  setCategory("Todos")
                }}
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </section>

        <section className="bg-[#1d3b2a] text-[#f8f7f2]" id="historia">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <p className="eyebrow text-[#c6d8bf]">Nuestra filosofía</p>
              <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
                Más naturaleza.
                <br />
                Más cuidado.
              </h2>
            </div>
            <div className="max-w-xl">
              <p className="text-lg leading-8 text-white/75">
                Elaboramos cada jabón a mano, en pequeños lotes y con tiempos de
                curado pacientes. Elegimos ingredientes de origen natural para
                ofrecer una limpieza amable con tu piel y el planeta.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-8">
                <div>
                  <strong className="font-serif text-3xl">100%</strong>
                  <p className="mt-1 text-xs text-white/55">Artesanal</p>
                </div>
                <div>
                  <strong className="font-serif text-3xl">6</strong>
                  <p className="mt-1 text-xs text-white/55">Variedades</p>
                </div>
                <div>
                  <strong className="font-serif text-3xl">4.9</strong>
                  <p className="mt-1 text-xs text-white/55">Valoración</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"
          id="conecta"
        >
          <div className="overflow-hidden rounded-[2rem] bg-[#e7ddcf] px-6 py-14 text-center sm:px-12 sm:py-20">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f8f7f2] text-[#b45132]">
              <YoutubeIcon />
            </span>
            <p className="eyebrow mt-6">Historias de Pinguinitos</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl tracking-tight sm:text-5xl">
              Consejos para cuidar tu piel naturalmente
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-[#1d2620]/65">
              Visita nuestro canal para conocer cómo hacemos cada jabón,
              descubrir sus ingredientes y crear una rutina amable con tu piel.
            </p>
            <a
              className="primary-button mx-auto mt-8 w-fit"
              href={toUrl(socials.youtube)}
              rel="noreferrer"
              target="_blank"
            >
              Visitar canal de YouTube <ArrowIcon />
            </a>
            <div className="mt-10 flex justify-center gap-3">
              <a
                aria-label="Instagram"
                className="social-button"
                href={toUrl(socials.instagram)}
                rel="noreferrer"
                target="_blank"
              >
                <InstagramIcon />
              </a>
              <a
                aria-label="Facebook"
                className="social-button"
                href={toUrl(socials.facebook)}
                rel="noreferrer"
                target="_blank"
              >
                <FacebookIcon />
              </a>
              <a
                aria-label="YouTube"
                className="social-button"
                href={toUrl(socials.youtube)}
                rel="noreferrer"
                target="_blank"
              >
                <YoutubeIcon />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1d2620]/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 text-sm text-[#1d2620]/55 sm:flex-row lg:px-8">
          <p>
            <span className="mr-3 font-serif text-xl text-[#1d2620]">
              Pinguinitos
            </span>{" "}
            Jabones artesanales para una piel feliz.
          </p>
          <p>© 2025 Pinguinitos · Privacidad · Términos</p>
        </div>
      </footer>

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onCheckout={() => {
            if (!cart.length) return
            setCartOpen(false)
            setCheckoutOpen(true)
          }}
          onClose={() => setCartOpen(false)}
          onUpdate={updateQuantity}
          subtotal={subtotal}
        />
      )}
      {checkoutOpen && (
        <CheckoutInvoice
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onComplete={(order) => {
            saveOrder(order)
            setCart([])
            setToast("¡Compra confirmada! Tu factura está lista")
          }}
          subtotal={subtotal}
        />
      )}
      {loginOpen && (
        <AdminLogin
          onClose={() => setLoginOpen(false)}
          onSuccess={() => {
            setIsAdmin(true)
            setLoginOpen(false)
            setAdminOpen(true)
          }}
        />
      )}
      {adminOpen && isAdmin && (
        <AdminPanel
          editing={editing}
          onClose={() => {
            setAdminOpen(false)
            setEditing(null)
          }}
          onDelete={(id) => {
            const updatedProducts = products.filter((product) => product.id !== id)
            setProducts(updatedProducts)
            saveStore({ products: updatedProducts })
            setToast("Producto eliminado")
          }}
          onEdit={setEditing}
          onLogout={() => {
            void signOut(auth)
            setIsAdmin(false)
            setAdminOpen(false)
            setEditing(null)
            setToast("Sesión de administrador cerrada")
          }}
          onSave={(product) => {
            const exists = products.some((item) => item.id === product.id)
            const updatedProducts = exists
              ? products.map((item) => (item.id === product.id ? product : item))
              : [product, ...products]
            setProducts(updatedProducts)
            saveStore({ products: updatedProducts })
            setEditing(null)
            setToast("Producto guardado correctamente")
          }}
          onSaveSocials={(links) => {
            setSocials(links)
            saveStore({ socials: links })
            setToast("Canales actualizados")
          }}
          orders={orders}
          products={products}
          socials={socials}
          onUploadImage={uploadProductImage}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#1d2620] px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function CartDrawer({
  cart,
  subtotal,
  onClose,
  onUpdate,
  onCheckout,
}: {
  cart: CartItem[]
  subtotal: number
  onClose: () => void
  onUpdate: (id: number, delta: number) => void
  onCheckout: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#1d2620]/35 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f8f7f2] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1d2620]/10 px-6 py-5">
          <div>
            <p className="font-serif text-2xl">Tu bolsa</p>
            <p className="mt-0.5 text-xs text-[#1d2620]/50">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} artículos
            </p>
          </div>
          <button
            aria-label="Cerrar carrito"
            className="icon-button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {cart.length ? (
            cart.map((item) => (
              <div className="flex gap-4" key={item.id}>
                <img
                  alt={item.title}
                  className="size-24 rounded-2xl object-cover"
                  src={item.image}
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-serif text-lg">{item.title}</p>
                      <p className="text-xs text-[#1d2620]/50">
                        {item.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex w-fit items-center rounded-full border border-[#1d2620]/15">
                    <button
                      aria-label="Quitar uno"
                      className="px-3 py-1"
                      onClick={() => onUpdate(item.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      aria-label="Agregar uno"
                      className="px-3 py-1"
                      onClick={() => onUpdate(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full bg-[#eae8df]">
                <BagIcon />
              </span>
              <p className="mt-5 font-serif text-2xl">Tu bolsa está vacía</p>
              <p className="mt-2 text-sm text-[#1d2620]/55">
                Descubre algo especial para ti.
              </p>
              <button
                className="mt-5 text-sm font-semibold underline underline-offset-4"
                onClick={onClose}
              >
                Seguir explorando
              </button>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-[#1d2620]/10 bg-white/50 p-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="mb-5 flex justify-between text-xs text-[#1d2620]/50">
              <span>Envío</span>
              <span>
                {subtotal >= 25000 ? "Gratis" : "Calculado al finalizar"}
              </span>
            </div>
            <button
              className="primary-button w-full justify-center"
              onClick={onCheckout}
            >
              Finalizar compra <ArrowIcon />
            </button>
            <p className="mt-3 text-center text-[11px] text-[#1d2620]/45">
              Pago seguro · Devoluciones fáciles
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

function CheckoutInvoice({
  cart,
  subtotal,
  onClose,
  onComplete,
}: {
  cart: CartItem[]
  subtotal: number
  onClose: () => void
  onComplete: (order: Order) => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [orderItems] = useState(cart)
  const [orderSubtotal] = useState(subtotal)
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    identification: "",
    email: "",
    phone: "",
    address: "",
    payment: "Tarjeta",
  })
  const [invoiceNumber] = useState(
    () => `PG-${Date.now().toString().slice(-8)}`,
  )
  const shipping = orderSubtotal >= 25000 ? 0 : 2500
  const total = orderSubtotal + shipping
  const includedTax = Math.round(total - total / 1.13)
  const invoiceDate = new Intl.DateTimeFormat("es-CR", {
    dateStyle: "long",
  }).format(new Date())

  const submitOrder = (event: FormEvent) => {
    event.preventDefault()
    setConfirmed(true)
    onComplete({
      id: invoiceNumber,
      date: new Date().toISOString(),
      customer,
      items: orderItems,
      subtotal: orderSubtotal,
      shipping,
      tax: includedTax,
      total,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#1d2620]/45 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto min-h-full max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] bg-[#f8f7f2] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1d2620]/10 px-6 py-5 sm:px-8">
            <div>
              <p className="eyebrow">
                {confirmed ? "Comprobante de compra" : "Finalizar compra"}
              </p>
              <h2 className="mt-1 font-serif text-2xl">
                {confirmed ? "Factura electrónica" : "Datos de facturación"}
              </h2>
            </div>
            <button
              aria-label="Cerrar facturación"
              className="icon-button"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>

          {!confirmed ? (
            <form
              className="grid lg:grid-cols-[1.15fr_.85fr]"
              onSubmit={submitOrder}
            >
              <div className="grid content-start gap-5 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#dce7d9] font-semibold text-[#1d3b2a]">
                    1
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">
                      Información del cliente
                    </h3>
                    <p className="text-xs text-[#1d2620]/50">
                      Estos datos aparecerán en tu factura
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="field-label">
                    Nombre completo
                    <input
                      className="field bg-white"
                      onChange={(event) =>
                        setCustomer({ ...customer, name: event.target.value })
                      }
                      required
                      value={customer.name}
                    />
                  </label>
                  <label className="field-label">
                    Cédula o identificación
                    <input
                      className="field bg-white"
                      onChange={(event) =>
                        setCustomer({
                          ...customer,
                          identification: event.target.value,
                        })
                      }
                      required
                      value={customer.identification}
                    />
                  </label>
                  <label className="field-label">
                    Correo electrónico
                    <input
                      className="field bg-white"
                      onChange={(event) =>
                        setCustomer({ ...customer, email: event.target.value })
                      }
                      required
                      type="email"
                      value={customer.email}
                    />
                  </label>
                  <label className="field-label">
                    Teléfono
                    <input
                      className="field bg-white"
                      onChange={(event) =>
                        setCustomer({ ...customer, phone: event.target.value })
                      }
                      required
                      type="tel"
                      value={customer.phone}
                    />
                  </label>
                </div>
                <label className="field-label">
                  Dirección de entrega
                  <textarea
                    className="field min-h-24 resize-none bg-white"
                    onChange={(event) =>
                      setCustomer({ ...customer, address: event.target.value })
                    }
                    required
                    value={customer.address}
                  />
                </label>
                <div>
                  <p className="field-label mb-2">Método de pago</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {["Tarjeta", "SINPE Móvil", "Transferencia"].map(
                      (method) => (
                        <label
                          className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-semibold transition ${
                            customer.payment === method
                              ? "border-[#1d3b2a] bg-[#dce7d9]"
                              : "border-[#1d2620]/10 bg-white"
                          }`}
                          key={method}
                        >
                          <input
                            checked={customer.payment === method}
                            className="sr-only"
                            name="payment"
                            onChange={() =>
                              setCustomer({ ...customer, payment: method })
                            }
                            type="radio"
                          />
                          {method}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1d2620]/10 bg-[#eeece4] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <h3 className="font-serif text-2xl">Resumen del pedido</h3>
                <div className="mt-6 space-y-4">
                  {orderItems.map((item) => (
                    <div className="flex items-center gap-3" key={item.id}>
                      <div className="relative">
                        <img
                          alt=""
                          className="size-14 rounded-xl object-cover"
                          src={item.image}
                        />
                        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#1d3b2a] text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3 border-t border-[#1d2620]/10 pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#1d2620]/60">Subtotal</span>
                    <span>{formatPrice(orderSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1d2620]/60">Envío</span>
                    <span>{shipping ? formatPrice(shipping) : "Gratis"}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#1d2620]/10 pt-4 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <p className="text-right text-[11px] text-[#1d2620]/45">
                    IVA incluido
                  </p>
                </div>
                <button className="primary-button mt-6 w-full justify-center">
                  Confirmar y facturar <ArrowIcon />
                </button>
                <p className="mt-3 text-center text-[11px] leading-5 text-[#1d2620]/45">
                  Al confirmar aceptas nuestros términos de compra.
                </p>
              </div>
            </form>
          ) : (
            <div className="p-5 sm:p-8">
              <div
                className="mx-auto max-w-3xl rounded-2xl border border-[#1d2620]/12 bg-white p-6 sm:p-10"
                id="invoice"
              >
                <div className="flex flex-col justify-between gap-6 border-b border-[#1d2620]/10 pb-7 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-serif text-3xl">Pinguinitos</p>
                    <p className="mt-1 text-xs text-[#1d2620]/50">
                      Jabones artesanales · Costa Rica
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#1d2620]/40">
                      Factura
                    </p>
                    <p className="mt-1 font-semibold">N.º {invoiceNumber}</p>
                    <p className="mt-1 text-xs text-[#1d2620]/50">
                      {invoiceDate}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 border-b border-[#1d2620]/10 py-7 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1d2620]/40">
                      Facturado a
                    </p>
                    <p className="mt-2 font-semibold">{customer.name}</p>
                    <p className="mt-1 text-sm text-[#1d2620]/60">
                      Identificación: {customer.identification}
                    </p>
                    <p className="text-sm text-[#1d2620]/60">
                      {customer.email} · {customer.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1d2620]/40">
                      Entregar en
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#1d2620]/70">
                      {customer.address}
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      Pago: {customer.payment}
                    </p>
                  </div>
                </div>

                <div className="py-7">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#1d2620]/10 pb-3 text-xs font-bold uppercase tracking-wider text-[#1d2620]/40">
                    <span>Descripción</span>
                    <span>Cant.</span>
                    <span>Total</span>
                  </div>
                  {orderItems.map((item) => (
                    <div
                      className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#1d2620]/8 py-4 text-sm"
                      key={item.id}
                    >
                      <span>{item.title}</span>
                      <span className="min-w-10 text-center">
                        {item.quantity}
                      </span>
                      <span className="min-w-20 text-right font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="ml-auto mt-5 grid max-w-xs gap-2 text-sm">
                    <div className="flex justify-between gap-12">
                      <span className="text-[#1d2620]/55">Subtotal</span>
                      <span>{formatPrice(orderSubtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-[#1d2620]/55">Envío</span>
                      <span>{shipping ? formatPrice(shipping) : "Gratis"}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-[#1d2620]/55">
                        IVA incluido (13%)
                      </span>
                      <span>{formatPrice(includedTax)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-12 border-t border-[#1d2620]/10 pt-3 text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#dce7d9] px-5 py-4 text-center text-sm text-[#1d3b2a]">
                  <strong>¡Gracias por tu compra!</strong> Enviamos una copia de
                  esta factura a {customer.email}.
                </div>
              </div>
              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-end gap-3">
                <button
                  className="rounded-full border border-[#1d2620]/15 px-5 py-3 text-sm font-semibold"
                  onClick={() => window.print()}
                >
                  Imprimir factura
                </button>
                <button className="primary-button" onClick={onClose}>
                  Volver a la tienda <ArrowIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminLogin({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const login = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )
      if (credential.user.email !== "admin@pinguinitos.com") {
        await signOut(auth)
        setError("Esta cuenta no tiene permisos de administración.")
        return
      }
      onSuccess()
    } catch {
      setError("El correo o la contraseña no son correctos.")
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[#1d2620]/45 p-5 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[2rem] bg-[#f8f7f2] p-7 shadow-2xl sm:p-10"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Cerrar inicio de sesión"
          className="icon-button absolute right-5 top-5"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <span className="grid size-14 place-items-center rounded-full bg-[#dce7d9] text-[#1d3b2a]">
          <LockIcon />
        </span>
        <p className="eyebrow mt-7">Acceso restringido</p>
        <h2 className="mt-2 font-serif text-4xl tracking-tight">
          Administración
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#1d2620]/60">
          Inicia sesión para gestionar los productos, precios, fotografías y
          canales de Pinguinitos.
        </p>

        <form className="mt-7 grid gap-5" onSubmit={login}>
          <label className="field-label">
            Correo electrónico
            <input
              autoComplete="username"
              className="field bg-white"
              onChange={(event) => {
                setEmail(event.target.value)
                setError("")
              }}
              placeholder="administrador@pinguinitos.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="field-label">
            Contraseña
            <input
              autoComplete="current-password"
              className="field bg-white"
              onChange={(event) => {
                setPassword(event.target.value)
                setError("")
              }}
              placeholder="Ingresa tu contraseña"
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p
              className="rounded-xl bg-[#f7e3dc] px-4 py-3 text-sm font-medium text-[#8c3b25]"
              role="alert"
            >
              {error}
            </p>
          )}
          <button className="primary-button mt-1 w-full justify-center">
            Iniciar sesión <ArrowIcon />
          </button>
        </form>

        <p className="mt-6 text-xs leading-5 text-[#1d2620]/60">
          Acceso protegido con Firebase Authentication.
        </p>
      </div>
    </div>
  )
}

function AdminPanel({
  products,
  orders,
  socials,
  editing,
  onClose,
  onEdit,
  onDelete,
  onSave,
  onSaveSocials,
  onUploadImage,
  onLogout,
}: {
  products: Product[]
  orders: Order[]
  socials: SocialLinks
  editing: Product | null
  onClose: () => void
  onEdit: (product: Product | null) => void
  onDelete: (id: number) => void
  onSave: (product: Product) => void
  onSaveSocials: (links: SocialLinks) => void
  onUploadImage: (file: File) => Promise<string>
  onLogout: () => void
}) {
  const emptyForm = {
    title: "",
    category: "Herbales",
    description: "",
    price: "",
    image: "",
  }
  const [form, setForm] = useState(emptyForm)
  const [socialForm, setSocialForm] = useState(socials)
  const [showForm, setShowForm] = useState(false)
  const [imageError, setImageError] = useState("")
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const soldUnits = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )
  const averageTicket = orders.length ? totalSales / orders.length : 0

  useEffect(() => {
    if (editing) {
      setForm({ ...editing, price: String(editing.price) })
      setShowForm(true)
    }
  }, [editing])

  const handleImage = async (file?: File) => {
    if (!file) return
    setImageError("")
    if (!file.type.startsWith("image/")) {
      setImageError("Selecciona una imagen PNG, JPG o WEBP.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("La imagen debe pesar menos de 8 MB.")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const preview = new Image()
        preview.onload = () => resolve(preview)
        preview.onerror = () => reject(new Error("No se pudo leer la imagen"))
        preview.src = objectUrl
      })
      const maximumSide = 960
      const scale = Math.min(1, maximumSide / Math.max(image.width, image.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height)
      const compressedImage = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      )
      if (!compressedImage) throw new Error("No se pudo optimizar la imagen")
      const imageUrl = await onUploadImage(
        new File([compressedImage], `${Date.now()}.jpg`, { type: "image/jpeg" }),
      )
      setForm((current) => ({ ...current, image: imageUrl }))
    } catch {
      setImageError("No se pudo subir la imagen. Revisa Firebase Storage e inténtalo de nuevo.")
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      id: editing?.id ?? Date.now(),
      title: form.title,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      image: form.image || photos.botanical,
      badge: editing?.badge,
    })
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f1efe8]">
      <header className="sticky top-0 z-10 border-b border-[#1d2620]/10 bg-[#f1efe8]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="font-serif text-2xl">
              Pinguinitos{" "}
              <span className="ml-2 font-sans text-xs font-semibold uppercase tracking-wider text-[#1d2620]/40">
                Gestión
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-[#1d2620]/5"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
            <button
              aria-label="Cerrar administración"
              className="icon-button"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Panel de control</p>
            <h2 className="mt-2 font-serif text-4xl">Tus productos</h2>
            <p className="mt-2 text-sm text-[#1d2620]/55">
              {products.length} productos publicados
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setShowForm(!showForm)
              onEdit(null)
              setForm(emptyForm)
            }}
          >
            <PlusIcon /> Nuevo producto
          </button>
        </div>

        {showForm && (
          <form
            className="mt-8 grid gap-7 rounded-3xl bg-white p-6 shadow-sm lg:grid-cols-[.75fr_1.25fr] lg:p-8"
            onSubmit={submit}
          >
            <label className="group relative grid min-h-72 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-[#1d2620]/25 bg-[#f8f7f2] text-center">
              {form.image ? (
                <img
                  alt="Vista previa del producto"
                  className="absolute inset-0 size-full object-cover"
                  src={form.image}
                />
              ) : (
                <span>
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#e7ddcf]">
                    <PlusIcon />
                  </span>
                  <strong className="mt-4 block text-sm">Cargar imagen</strong>
                  <small className="mt-1 block text-[#1d2620]/45">
                    PNG, JPG o WEBP · se optimiza automáticamente
                  </small>
                </span>
              )}
              <input
                accept="image/*"
                className="sr-only"
                onChange={(event) => handleImage(event.target.files?.[0])}
                type="file"
              />
              {imageError && (
                <span className="absolute inset-x-4 bottom-4 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-[#0e5d9f] shadow-sm" role="alert">
                  {imageError}
                </span>
              )}
            </label>
            <div className="grid content-start gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl">
                  {editing ? "Editar producto" : "Nuevo producto"}
                </h3>
                <button
                  aria-label="Cerrar formulario"
                  className="icon-button"
                  onClick={() => setShowForm(false)}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="field-label">
                  Título
                  <input
                    className="field"
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                    value={form.title}
                  />
                </label>
                <label className="field-label">
                  Categoría
                  <select
                    className="field"
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    value={form.category}
                  >
                    <option>Herbales</option>
                    <option>Piel sensible</option>
                    <option>Limpieza profunda</option>
                    <option>Exfoliantes</option>
                  </select>
                </label>
              </div>
              <label className="field-label">
                Descripción
                <textarea
                  className="field min-h-24 resize-none"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  value={form.description}
                />
              </label>
              <label className="field-label sm:max-w-xs">
                Precio (₡)
                <input
                  className="field"
                  min="1"
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  type="number"
                  value={form.price}
                />
              </label>
              <button className="primary-button w-fit" type="submit">
                Guardar producto <ArrowIcon />
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-[#1d2620]/10 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1d2620]/45 md:grid">
            <span>Producto</span>
            <span>Categoría</span>
            <span>Precio</span>
            <span>Acciones</span>
          </div>
          {products.map((product) => (
            <div
              className="flex flex-col gap-4 border-b border-[#1d2620]/8 p-5 last:border-0 md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:px-6"
              key={product.id}
            >
              <div className="flex items-center gap-4">
                <img
                  alt=""
                  className="size-16 rounded-xl object-cover"
                  src={product.image}
                />
                <div>
                  <p className="font-semibold">{product.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-[#1d2620]/45">
                    {product.description}
                  </p>
                </div>
              </div>
              <span className="text-sm text-[#1d2620]/65">
                {product.category}
              </span>
              <span className="font-semibold">
                {formatPrice(product.price)}
              </span>
              <div className="flex gap-2">
                <button
                  aria-label={`Editar ${product.title}`}
                  className="icon-button"
                  onClick={() => onEdit(product)}
                >
                  <EditIcon />
                </button>
                <button
                  aria-label={`Eliminar ${product.title}`}
                  className="icon-button text-[#b45132]"
                  onClick={() => onDelete(product.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Rendimiento</p>
              <h2 className="mt-2 font-serif text-4xl">Informe de ventas</h2>
              <p className="mt-2 text-sm text-[#1d2620]/55">
                Resumen de todas las compras confirmadas.
              </p>
            </div>
            <p className="text-xs font-medium text-[#1d2620]/45">
              Actualizado automáticamente
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#1d3b2a] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Ventas totales
              </p>
              <p className="mt-3 font-serif text-3xl">
                {formatPrice(totalSales)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1d2620]/40">
                Pedidos
              </p>
              <p className="mt-3 font-serif text-3xl">{orders.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1d2620]/40">
                Unidades vendidas
              </p>
              <p className="mt-3 font-serif text-3xl">{soldUnits}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1d2620]/40">
                Ticket promedio
              </p>
              <p className="mt-3 font-serif text-3xl">
                {formatPrice(averageTicket)}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="hidden grid-cols-[1fr_1.2fr_.8fr_.8fr] gap-4 border-b border-[#1d2620]/10 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1d2620]/45 md:grid">
              <span>Factura</span>
              <span>Cliente</span>
              <span>Fecha</span>
              <span className="text-right">Total</span>
            </div>
            {orders.length ? (
              orders.map((order) => (
                <div
                  className="grid gap-3 border-b border-[#1d2620]/8 p-5 last:border-0 md:grid-cols-[1fr_1.2fr_.8fr_.8fr] md:items-center md:px-6"
                  key={order.id}
                >
                  <div>
                    <p className="text-sm font-semibold">{order.id}</p>
                    <p className="mt-1 text-xs text-[#1d2620]/45">
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{" "}
                      artículos · {order.customer.payment}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.customer.name}</p>
                    <p className="mt-1 text-xs text-[#1d2620]/45">
                      {order.customer.email}
                    </p>
                  </div>
                  <p className="text-sm text-[#1d2620]/60">
                    {new Intl.DateTimeFormat("es-CR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(order.date))}
                  </p>
                  <p className="text-left font-semibold md:text-right">
                    {formatPrice(order.total)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-6 py-14 text-center">
                <p className="font-serif text-2xl">Aún no hay ventas</p>
                <p className="mt-2 text-sm text-[#1d2620]/50">
                  Las compras confirmadas aparecerán aquí automáticamente.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 rounded-3xl bg-[#1d3b2a] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <YoutubeIcon />
            <div>
              <h3 className="font-serif text-2xl">Canales y redes</h3>
              <p className="text-xs text-white/50">
                Conecta tu comunidad con la tienda
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="field-label text-white/70">
              YouTube
              <input
                className="field border-white/15 bg-white/10 text-white placeholder:text-white/35"
                onChange={(event) =>
                  setSocialForm({
                    ...socialForm,
                    youtube: event.target.value,
                  })
                }
                value={socialForm.youtube}
              />
            </label>
            <label className="field-label text-white/70">
              Instagram
              <input
                className="field border-white/15 bg-white/10 text-white placeholder:text-white/35"
                onChange={(event) =>
                  setSocialForm({
                    ...socialForm,
                    instagram: event.target.value,
                  })
                }
                value={socialForm.instagram}
              />
            </label>
            <label className="field-label text-white/70">
              Facebook
              <input
                className="field border-white/15 bg-white/10 text-white placeholder:text-white/35"
                onChange={(event) =>
                  setSocialForm({
                    ...socialForm,
                    facebook: event.target.value,
                  })
                }
                value={socialForm.facebook}
              />
            </label>
          </div>
          <button
            className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1d3b2a]"
            onClick={() => onSaveSocials(socialForm)}
            type="button"
          >
            Guardar canales
          </button>
        </div>
      </main>
    </div>
  )
}
