import aadaaTurizimii from '@/assets/aadaa fi turizimii.jpeg'
import abbaaAlangaa from '@/assets/abbaa alangaa.jpeg'
import abbaaTayitaa from '@/assets/abbaa tayitaa egumsa nannoo.jpeg'
import barnoota from '@/assets/barnoota.jpeg'
import bishaan from '@/assets/bishaan.jpeg'
import buusaaGonofaa from '@/assets/buusaa gonofaa.jpeg'
import chuo from '@/assets/CHUO.jpeg'
import dhaabbataBishaan from '@/assets/dabbata bishaan dhuguutii.jpeg'
import daldala from '@/assets/Daldala.jpeg'
import fayyaa from '@/assets/fayyaa.jpeg'
import galii from '@/assets/galii.jpeg'
import galmeessa from '@/assets/galmessa silii.jpeg'
import geejjiba from '@/assets/geejjiba.jpeg'
import hawaasummaa from '@/assets/hawaasummaa.jpeg'
import inveestimantii from '@/assets/invenstimentii.png'
import kominikeeshinii from '@/assets/kominikeeshinii.jpeg'
import konistrakshinii from '@/assets/konistrakshinii.jpeg'
import lafa from '@/assets/lafa.jpeg'
import maallaqa from '@/assets/mallaqaa.jpeg'
import qopheessa from '@/assets/mana qophessaa.jpeg'
import poolisii from '@/assets/polisii.jpeg'
import psmqn from '@/assets/PSMQN.jpeg'
import qonna from '@/assets/qonnaa.jpeg'
import sayinsiiTech from '@/assets/saynsii fi technolojii.jpeg'
import wajjiraBulchinsaa from '@/assets/wajjira bulchinsaa.jpeg'

/**
 * Maps office/organization keywords to profile photos.
 * Keys are matched (case-insensitively) as substrings of the office name.
 * The order matters only when two keys share a substring — put the more
 * specific key first. (Kaadastara and D/Manneeni photos are not uploaded yet.)
 */
const officePhotoMap: Record<string, string> = {
  // Galmeessa Siivilii (Civil Registration)
  galmeessa: galmeessa,
  sivilii: galmeessa,
  // Dhaabbata Bishaan dhugaatii (Drinking Water Enterprise)
  dhaabbata: dhaabbataBishaan,
  dhugaatii: dhaabbataBishaan,
  // CHUO
  chuo: chuo,
  // Hawaasummaa (Social / Labour)
  hawaasummaa: hawaasummaa,
  // Daldala (Trade)
  daldala: daldala,
  // Bishaan Albuudaa fi Inarjii (Mineral & Water Resources)
  albuudaa: bishaan,
  inarjii: bishaan,
  // fayyaa (Health)
  fayyaa: fayyaa,
  // W/Bulchiinsaa (Administration)
  bulchiinsaa: wajjiraBulchinsaa,
  // PSMQN
  psmqn: psmqn,
  // Koominikeeshinii (Communication)
  koomini: kominikeeshinii,
  keeshinii: kominikeeshinii,
  // Geejiba (Transport)
  geejiba: geejjiba,
  geejjiba: geejjiba,
  // Qonna (Agriculture)
  qonna: qonna,
  // M/Qopheessa (Planning)
  qopheessa: qopheessa,
  // Saayinsii Technology (Science & Technology)
  saayinsii: sayinsiiTech,
  technolojii: sayinsiiTech,
  technology: sayinsiiTech,
  // Koonistraakshinii (Construction)
  traakshinii: konistrakshinii,
  konistra: konistrakshinii,
  // Barnoota (Education)
  barnoota: barnoota,
  // Abba Alangaa (Prosecution)
  alangaa: abbaaAlangaa,
  // Abbaa Tayitaa Egumsa nannoo (Environment Protection)
  tayitaa: abbaaTayitaa,
  'egumsa nannoo': abbaaTayitaa,
  // Lafa (Land)
  lafa: lafa,
  // Galii (Revenue / Tax)
  galii: galii,
  // Buusaa Gonnofaa (Rent Fund)
  buusaa: buusaaGonofaa,
  gonnofaa: buusaaGonofaa,
  // Maallaqa (Finance)
  maallaqa: maallaqa,
  mallaqaa: maallaqa,
  // Adaa fi Turizimii (Culture & Tourism)
  turizimii: aadaaTurizimii,
  aadaa: aadaaTurizimii,
  // Poolisii (Police)
  poolisii: poolisii,
  polisii: poolisii,
  // Inveestimantii (Investment)
  inveestimantii: inveestimantii,
  invenstimentii: inveestimantii,
}

export function getOfficePhoto(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [key, photo] of Object.entries(officePhotoMap)) {
    if (lower.includes(key)) return photo
  }
  return null
}

