using Moonboard;
using Newtonsoft.Json;
using System;

namespace Moonboard;

public class HoldJsonConverter : JsonConverter<Hold>
{
    public override void WriteJson(JsonWriter writer, Hold? value, JsonSerializer serializer)
    {
        writer.WriteValue(value?.Name);
    }

    public override Hold ReadJson(
        JsonReader reader,
        Type objectType,
        Hold existingValue,
        bool hasExistingValue,
        JsonSerializer serializer)
    {
        if (reader.TokenType != JsonToken.String)
        {
            throw new JsonSerializationException("Expected a string.");
        }

        var name = (string)reader.Value!;

        if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
        {
            throw new JsonSerializationException("Invalid Hold.");
        }

        char column = char.ToUpperInvariant(name[0]);
        int columnIndex = column - 'A';

        if (!int.TryParse(name[1..], out int row))
        {
            throw new JsonSerializationException("Invalid Hold.");
        }

        return new Hold(columnIndex, row - 1);
    }
}