# Troca o nome do produto nos catálogos de tradução no momento do build.
#
# Os .po do repositório ficam iguais aos do upstream (sem conflitos nos merges);
# o Dockerfile corre este script antes de compilar:
#
#     elixir -pa _build/prod/lib/expo/ebin aitra/brand.exs
#
# Em cada mensagem cujo msgid ou msgstr diga "Tymeslot":
#   * msgstr vazio (inglês e textos por traduzir) passa a ser o msgid;
#   * "Tymeslot" no msgstr passa a ser o nome da marca.
# O msgid nunca muda, por isso as chamadas a dgettext continuam a encontrar a mensagem.

defmodule Aitra.Brand do
  @from "Tymeslot"
  @to System.get_env("AITRA_BRAND_NAME", "Aitra Cal")

  def run(root) do
    files = Path.wildcard(Path.join(root, "priv/gettext/*/LC_MESSAGES/*.po"))

    changed =
      Enum.reduce(files, 0, fn path, acc ->
        po = Expo.PO.parse_file!(path)
        {messages, n} = Enum.map_reduce(po.messages, 0, &rebrand/2)

        if n > 0 do
          File.write!(path, Expo.PO.compose(%{po | messages: messages}))
        end

        acc + n
      end)

    IO.puts("aitra/brand.exs: #{changed} mensagens com \"#{@to}\" em #{length(files)} catálogos")
  end

  defp rebrand(%Expo.Message.Singular{} = m, n) do
    id = text(m.msgid)
    str = text(m.msgstr)

    if mentions?(id) or mentions?(str) do
      str = if str == "", do: id, else: str
      {%{m | msgstr: [swap(str)]}, n + 1}
    else
      {m, n}
    end
  end

  defp rebrand(%Expo.Message.Plural{} = m, n) do
    id = text(m.msgid)
    plural = text(m.msgid_plural)
    strs = Map.new(m.msgstr, fn {i, s} -> {i, text(s)} end)

    if mentions?(id) or mentions?(plural) or Enum.any?(Map.values(strs), &mentions?/1) do
      strs =
        if Enum.all?(Map.values(strs), &(&1 == "")),
          do: Map.new(strs, fn {i, _} -> {i, if(i == 0, do: id, else: plural)} end),
          else: strs

      {%{m | msgstr: Map.new(strs, fn {i, s} -> {i, [swap(s)]} end)}, n + 1}
    else
      {m, n}
    end
  end

  defp rebrand(other, n), do: {other, n}

  defp text(iodata), do: IO.iodata_to_binary(iodata)
  defp mentions?(s), do: String.contains?(s, @from)
  defp swap(s), do: String.replace(s, @from, @to)
end

Aitra.Brand.run(System.get_env("AITRA_ROOT", File.cwd!()))
