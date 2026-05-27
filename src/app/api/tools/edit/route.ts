import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, pin } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la herramienta' }, { status: 400 });
    }

    const { data: tool, error } = await supabase
      .from('tools')
      .select('edit_pin')
      .eq('id', id)
      .single();

    if (error || !tool) {
      return NextResponse.json({ error: 'Herramienta no encontrada' }, { status: 404 });
    }

    // Si la herramienta no tiene PIN registrado, se permite el acceso libre (o para setear uno nuevo)
    if (!tool.edit_pin) {
      return NextResponse.json({ success: true, isNewPinNeeded: true });
    }

    if (String(tool.edit_pin) === String(pin)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, pin, name, description, category, author, team, file_url, image_url } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la herramienta' }, { status: 400 });
    }

    // Obtener la herramienta para verificar el PIN
    const { data: tool, error: fetchError } = await supabase
      .from('tools')
      .select('edit_pin')
      .eq('id', id)
      .single();

    if (fetchError || !tool) {
      return NextResponse.json({ error: 'Herramienta no encontrada' }, { status: 404 });
    }

    // Si la herramienta tiene un PIN registrado en la base de datos, validar que coincida.
    if (tool.edit_pin && String(tool.edit_pin) !== String(pin)) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    // Construir campos a actualizar
    const updateData: any = {
      name,
      description,
      category,
      author,
      team,
      file_url,
      image_url,
    };

    // Si la herramienta no tenía un PIN y se provee uno nuevo, se guarda.
    if (!tool.edit_pin && pin) {
      updateData.edit_pin = pin;
    }

    const { error: updateError } = await supabase
      .from('tools')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
