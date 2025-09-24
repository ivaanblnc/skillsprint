import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es un juez (por ahora solo verificamos JUDGE y CREATOR como admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'JUDGE' && user?.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden - Judge access required' }, { status: 403 });
    }

    const { status, feedback } = await request.json();

    // Validar el status - por ahora usamos ACCEPTED y WRONG_ANSWER en lugar de REJECTED
    const validStatuses = ['ACCEPTED', 'REJECTED', 'WRONG_ANSWER'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const submissionId = params.submissionId;

    // Verificar que la submission existe y está pendiente
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { status: true, userId: true }
    });

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (existingSubmission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission is not pending review' }, { status: 400 });
    }

    // Usar WRONG_ANSWER si viene REJECTED hasta que se actualice el cliente
    const finalStatus = status === 'REJECTED' ? 'WRONG_ANSWER' : status;

    // Actualizar la submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus as any,
      },
    });

    // Si hay feedback, crearlo
    if (feedback && feedback.trim()) {
      await prisma.feedback.create({
        data: {
          submissionId: submissionId,
          judgeId: session.user.id,
          comment: feedback.trim(),
          rating: 5, // Default rating, could be made configurable
        },
      });
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: `Submission ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es un juez
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'JUDGE' && user?.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden - Judge access required' }, { status: 403 });
    }

    const submissionId = params.submissionId;

    // Obtener detalles completos de la submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
          }
        },
        feedbacks: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
