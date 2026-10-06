import {
  IconBook,
  IconBuildingCommunity,
  IconBuildingMosque,
  IconCalendarEvent,
  IconCertificate,
  IconHeartHandshake,
  IconMapPin,
  IconMicrophone,
  IconSchool,
  IconScript,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import qurban from "../../../assets/imgs/stats/goat.png";
import kaabah from "../../../assets/imgs/stats/kaabah.png";

// Icons an admin can pick for an achievement; stored by key in Firestore.
// Their names in the editor live under icons.<key> in internal/Website.json.
export const STAT_ICONS = {
  users: { Icon: IconUsers },
  group: { Icon: IconUsersGroup },
  school: { Icon: IconSchool },
  partners: { Icon: IconBuildingCommunity },
  book: { Icon: IconBook },
  script: { Icon: IconScript },
  mosque: { Icon: IconBuildingMosque },
  certificate: { Icon: IconCertificate },
  seminar: { Icon: IconMicrophone },
  event: { Icon: IconCalendarEvent },
  charity: { Icon: IconHeartHandshake },
  location: { Icon: IconMapPin },
  kaabah: { image: kaabah },
  goat: { image: qurban },
};
