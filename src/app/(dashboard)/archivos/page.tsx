import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Folder, FileText, Image, Table, Download } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils/format'
import { Avatar } from '@/components/common/Avatar'

const MIME_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': Table,
  'text/csv': Table,
}

function getFileIcon(mimeType: string): React.ElementType {
  if (mimeType.startsWith('image/')) return Image
  return MIME_ICONS[mimeType] ?? FileText
}

export default async function ArchivosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true },
  })

  if (!membership) redirect('/login')

  const files = await prisma.messageAttachment.findMany({
    where: {
      message: {
        OR: [
          { channel: { companyId: membership.companyId } },
          {
            conversation: {
              companyId: membership.companyId,
              members: { some: { userId: session.user.id } },
            },
          },
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      message: {
        select: {
          channel: { select: { name: true } },
        },
      },
    },
  })

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archivos compartidos</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {files.length} archivo{files.length !== 1 ? 's' : ''} compartido{files.length !== 1 ? 's' : ''}
        </p>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="Sin archivos compartidos"
          description="Los documentos e imágenes compartidos en canales y mensajes aparecerán aquí."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Archivo</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">Canal</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden md:table-cell">Subido por</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden lg:table-cell">Fecha</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3 hidden sm:table-cell">Tamaño</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType)
                const displayName =
                  file.uploadedBy.firstName && file.uploadedBy.lastName
                    ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`
                    : file.uploadedBy.name ?? '—'

                return (
                  <tr key={file.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {file.message?.channel?.name ? `#${file.message.channel.name}` : 'DM'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={file.uploadedBy.name}
                          firstName={file.uploadedBy.firstName}
                          lastName={file.uploadedBy.lastName}
                          avatarUrl={file.uploadedBy.avatarUrl}
                          size="xs"
                        />
                        <span className="text-sm text-gray-500 truncate max-w-[100px]">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(file.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {file.publicUrl && (
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors inline-flex"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
