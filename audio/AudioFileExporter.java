import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;

public class AudioFileExporter {
    public static void main(String[] args) throws IOException {
        String folderPath = "../assets/audio";
        File folder = new File(folderPath);

        if (!folder.exists() || !folder.isDirectory()) {
            System.out.println("Folder does not exist: " + folderPath);
            return;
        }

        File[] files = folder.listFiles((dir, name) ->
            name.toLowerCase().endsWith(".mp3") || name.toLowerCase().endsWith(".wav")
        );

        if (files == null || files.length == 0) {
            System.out.println("No audio files found.");
            return;
        }

        String[] filenames = Arrays.stream(files)
            .map(File::getName)
            .sorted(String::compareToIgnoreCase)
            .toArray(String[]::new);

        StringBuilder builder = new StringBuilder();
        builder.append("{\n  \"files\" : [\n");
        for (int i = 0; i < filenames.length; i++) {
            builder.append("    \"").append(filenames[i]).append("\"");
            if (i < filenames.length - 1) builder.append(",");
            builder.append("\n");
        }
        builder.append("  ]\n}");
        
        String filename = "audio_files.json";
        try (FileWriter writer = new FileWriter(filename)) {
            writer.write(builder.toString());
        }

        System.out.println("Exported " + filenames.length + " files to " + filename);
    }
}