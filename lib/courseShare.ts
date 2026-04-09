import { Share } from 'react-native';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCourseId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function buildCourseDeepLink(courseId: string): string {
  return `bailando://course/details?courseId=${courseId}`;
}

export async function shareCourseLink({
  courseId,
  title,
}: {
  courseId: string;
  title: string;
}): Promise<void> {
  if (!isValidCourseId(courseId)) return;
  const link = buildCourseDeepLink(courseId);
  await Share.share({ message: `${title}\n${link}`, url: link });
}
