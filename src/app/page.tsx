import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function RootPage() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')

  if (adminToken) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
