import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faBagShopping,
  faBell,
  faBoxOpen,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faEllipsis,
  faHeart as faSolidHeart,
  faHouse,
  faLaptop,
  faMagnifyingGlass,
  faMinus,
  faPersonRunning,
  faPlus,
  faShirt,
  faSpa,
  faStar,
  faTag,
  faTrashCan,
  faUser,
  faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons'
import { faHeart as faRegularHeart } from '@fortawesome/free-regular-svg-icons'

const icons = {
  arrowLeft: faArrowLeft,
  arrowRight: faArrowRight,
  arrowUpRight: faArrowUpRightFromSquare,
  bag: faBagShopping,
  bell: faBell,
  box: faBoxOpen,
  check: faCheck,
  chevronRight: faChevronRight,
  error: faCircleExclamation,
  ellipsis: faEllipsis,
  heart: faRegularHeart,
  heartFilled: faSolidHeart,
  home: faHouse,
  laptop: faLaptop,
  minus: faMinus,
  plus: faPlus,
  search: faMagnifyingGlass,
  running: faPersonRunning,
  shirt: faShirt,
  sparkle: faWandMagicSparkles,
  spa: faSpa,
  star: faStar,
  tag: faTag,
  trash: faTrashCan,
  user: faUser
}

const categoryIcons = {
  Accessories: faTag,
  Beauty: faSpa,
  Electronics: faLaptop,
  Fashion: faShirt,
  'Home & Living': faHouse,
  'Sports & Outdoor': faPersonRunning
}

export function Icon({ name, ...props }) {
  return <FontAwesomeIcon icon={icons[name] || faTag} {...props} />
}

export function CategoryIcon({ name, ...props }) {
  return <FontAwesomeIcon icon={categoryIcons[name] || faTag} {...props} />
}