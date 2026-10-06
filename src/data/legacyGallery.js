/**
 * The photos of the old home page gallery, grouped as it showed them.
 * The Website dashboard can import each group once as a news post, after
 * which the posts are edited like any other.
 */
import Umrah1 from "../assets/imgs/homepage/gallery/umrah/umrah1.jpg";
import Umrah2 from "../assets/imgs/homepage/gallery/umrah/umrah2.jpg";
import Umrah3 from "../assets/imgs/gallery/slide3.webp";
import Kaderisasi1 from "../assets/imgs/programs/DQ.jpg";
import Kaderisasi2 from "../assets/imgs/homepage/gallery/kaderisasi/kaderisasi.jpg";
import Kaderisasi3 from "../assets/imgs/homepage/gallery/kaderisasi/kaderisasi3.jpg";
import Majelis1 from "../assets/imgs/homepage/gallery/majelis/majelis1.jpg";
import Majelis2 from "../assets/imgs/homepage/gallery/majelis/majelis2.jpg";
import Majelis3 from "../assets/imgs/homepage/gallery/majelis/majelis3.jpg";
import Seminar1 from "../assets/imgs/homepage/programs/seminar.jpg";
import Seminar2 from "../assets/imgs/homepage/gallery/seminar/seminar2.jpg";
import Seminar3 from "../assets/imgs/homepage/gallery/seminar/seminar3.jpg";

export const LEGACY_GALLERY = [
  {
    slug: "galeri-umrah-tadarus-5t",
    title: "Umrah Tadarus 5T",
    category: "umrah",
    body: "Dokumentasi kegiatan Umrah Tadarus 5T bersama Markaz Tadarus Indonesia.",
    images: [Umrah1, Umrah2, Umrah3],
  },
  {
    slug: "galeri-pelatihan-tadarus-5t",
    title: "Pelatihan Tadarus 5T",
    category: "pelatihan",
    body: "Dokumentasi kegiatan Pelatihan Tadarus 5T bersama Markaz Tadarus Indonesia.",
    images: [Kaderisasi1, Kaderisasi2, Kaderisasi3],
  },
  {
    slug: "galeri-majelis-tadarus-5t",
    title: "Majelis Tadarus 5T",
    category: "majelis",
    body: "Dokumentasi kegiatan Majelis Tadarus 5T bersama Markaz Tadarus Indonesia.",
    images: [Majelis1, Majelis2, Majelis3],
  },
  {
    slug: "galeri-seminar-tadarus-5t",
    title: "Seminar Tadarus 5T",
    category: "seminar",
    body: "Dokumentasi kegiatan Seminar Tadarus 5T bersama Markaz Tadarus Indonesia.",
    images: [Seminar1, Seminar2, Seminar3],
  },
];
